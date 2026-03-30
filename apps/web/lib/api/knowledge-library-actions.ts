import { and, eq, inArray, isNull } from "drizzle-orm";

import { documents, getDb, workspaceDirectories } from "@anchordesk/db";

import {
  deleteDocumentSearchIndexAndAssets,
  syncDocumentCitationMetadata,
  syncDocumentSearchIndex,
} from "./document-index";
import {
  buildDirectoryMovePlan,
  buildDocumentMovePlan,
  compactKnowledgeBaseSelection,
} from "./knowledge-base-operations";
import {
  getDirectoryName,
  isSameOrDescendantPath,
  replacePathPrefix,
} from "./directory-paths";

type LibraryDirectoryRecord = typeof workspaceDirectories.$inferSelect;
type LibraryDocumentRecord = typeof documents.$inferSelect;

function findCoveringDirectoryMove(
  plans: Array<{ fromPath: string; toPath: string }>,
  path: string,
) {
  return plans.find((plan) => isSameOrDescendantPath(path, plan.fromPath)) ?? null;
}

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

export async function createKnowledgeLibraryDirectory(input: {
  libraryId: string;
  parentDirectoryId: string;
  name: string;
}) {
  const db = getDb();
  const [parentDirectory] = await db
    .select()
    .from(workspaceDirectories)
    .where(
      and(
        eq(workspaceDirectories.id, input.parentDirectoryId),
        eq(workspaceDirectories.libraryId, input.libraryId),
        isNull(workspaceDirectories.deletedAt),
      ),
    )
    .limit(1);

  if (!parentDirectory) {
    throw new Error("目标父目录不存在");
  }

  const path = `${parentDirectory.path}/${input.name}`.replace(/\/+/g, "/");
  const existingDirectory = await db
    .select()
    .from(workspaceDirectories)
    .where(
      and(
        eq(workspaceDirectories.libraryId, input.libraryId),
        eq(workspaceDirectories.path, path),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existingDirectory && !existingDirectory.deletedAt) {
    throw new Error("目录已存在");
  }

  const conflictingDocument = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.libraryId, input.libraryId), eq(documents.logicalPath, path)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (conflictingDocument) {
    throw new Error("已有同名文件占用该路径");
  }

  if (existingDirectory) {
    const [directory] = await db
      .update(workspaceDirectories)
      .set({
        parentId: parentDirectory.id,
        name: input.name.trim(),
        updatedAt: new Date(),
        deletedAt: null,
      })
      .where(eq(workspaceDirectories.id, existingDirectory.id))
      .returning();

    return directory;
  }

  const [directory] = await db
    .insert(workspaceDirectories)
    .values({
      libraryId: input.libraryId,
      workspaceId: null,
      parentId: parentDirectory.id,
      name: input.name.trim(),
      path,
    })
    .returning();

  return directory;
}

export async function moveKnowledgeLibraryEntries(input: {
  libraryId: string;
  targetDirectoryId: string;
  directoryIds: string[];
  documentIds: string[];
}) {
  const db = getDb();
  const [targetDirectory, selectedDirectories, selectedDocuments, allDirectories, allDocuments] =
    await Promise.all([
      db
        .select()
        .from(workspaceDirectories)
        .where(
          and(
            eq(workspaceDirectories.id, input.targetDirectoryId),
            eq(workspaceDirectories.libraryId, input.libraryId),
            isNull(workspaceDirectories.deletedAt),
          ),
        )
        .limit(1)
        .then((rows) => rows[0] ?? null),
      input.directoryIds.length > 0
        ? db
            .select()
            .from(workspaceDirectories)
            .where(
              and(
                eq(workspaceDirectories.libraryId, input.libraryId),
                isNull(workspaceDirectories.deletedAt),
                inArray(workspaceDirectories.id, uniqueValues(input.directoryIds)),
              ),
            )
        : Promise.resolve([]),
      input.documentIds.length > 0
        ? db
            .select()
            .from(documents)
            .where(
              and(
                eq(documents.libraryId, input.libraryId),
                inArray(documents.id, uniqueValues(input.documentIds)),
              ),
            )
        : Promise.resolve([]),
      db
        .select()
        .from(workspaceDirectories)
        .where(
          and(
            eq(workspaceDirectories.libraryId, input.libraryId),
            isNull(workspaceDirectories.deletedAt),
          ),
        ),
      db.select().from(documents).where(eq(documents.libraryId, input.libraryId)),
    ]);

  if (!targetDirectory) {
    throw new Error("目标目录不存在");
  }

  const compactedSelection = compactKnowledgeBaseSelection({
    directories: selectedDirectories.map((directory) => ({
      id: directory.id,
      path: directory.path,
      name: directory.name,
    })),
    documents: selectedDocuments.map((document) => ({
      id: document.id,
      logicalPath: document.logicalPath,
      directoryPath: document.directoryPath,
      sourceFilename: document.sourceFilename,
    })),
  });

  const directoryMoves = buildDirectoryMovePlan(
    compactedSelection.directories,
    targetDirectory.path,
  ).filter((plan) => plan.fromPath !== plan.toPath);
  const standaloneDocumentMoves = buildDocumentMovePlan(
    compactedSelection.documents,
    targetDirectory.path,
  ).filter((plan) => plan.fromLogicalPath !== plan.toLogicalPath);

  const affectedDirectories = allDirectories.filter((directory) =>
    directoryMoves.some((plan) => isSameOrDescendantPath(directory.path, plan.fromPath)),
  );
  const affectedDocuments = allDocuments.filter((document) =>
    directoryMoves.some((plan) => isSameOrDescendantPath(document.directoryPath, plan.fromPath)),
  );
  const unaffectedDirectoryPaths = new Set(
    allDirectories
      .filter((directory) => !affectedDirectories.some((item) => item.id === directory.id))
      .map((directory) => directory.path),
  );
  const unaffectedDocumentPaths = new Set(
    allDocuments
      .filter(
        (document) =>
          !affectedDocuments.some((item) => item.id === document.id) &&
          !standaloneDocumentMoves.some((item) => item.id === document.id),
      )
      .map((document) => document.logicalPath),
  );
  const plannedDirectoryTargets = new Set<string>();
  const plannedDocumentTargets = new Set<string>();

  for (const move of directoryMoves) {
    if (unaffectedDirectoryPaths.has(move.toPath) || plannedDirectoryTargets.has(move.toPath)) {
      throw new Error(`目标目录已存在同名目录：${getDirectoryName(move.toPath)}`);
    }

    plannedDirectoryTargets.add(move.toPath);
  }

  const nestedDocumentMoves = affectedDocuments.map((document) => {
    const plan = findCoveringDirectoryMove(directoryMoves, document.directoryPath);
    if (!plan) {
      return null;
    }

    return {
      id: document.id,
      document,
      toDirectoryPath: replacePathPrefix(document.directoryPath, plan.fromPath, plan.toPath),
      toLogicalPath: replacePathPrefix(document.logicalPath, plan.fromPath, plan.toPath),
    };
  });

  const allDocumentMoves = [
    ...nestedDocumentMoves.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    ...standaloneDocumentMoves.map((move) => ({
      id: move.id,
      document: allDocuments.find((document) => document.id === move.id) as LibraryDocumentRecord,
      toDirectoryPath: move.toDirectoryPath,
      toLogicalPath: move.toLogicalPath,
    })),
  ];

  for (const move of allDocumentMoves) {
    if (unaffectedDocumentPaths.has(move.toLogicalPath) || plannedDocumentTargets.has(move.toLogicalPath)) {
      throw new Error(`目标目录已存在同名文件：${move.document.sourceFilename}`);
    }

    plannedDocumentTargets.add(move.toLogicalPath);
  }

  const topLevelDirectoryMovesById = new Map(directoryMoves.map((move) => [move.id, move] as const));

  await db.transaction(async (tx) => {
    for (const directory of affectedDirectories) {
      const topLevelMove = topLevelDirectoryMovesById.get(directory.id);
      const coveringMove = findCoveringDirectoryMove(directoryMoves, directory.path);

      if (!coveringMove) {
        continue;
      }

      await tx
        .update(workspaceDirectories)
        .set({
          path: replacePathPrefix(directory.path, coveringMove.fromPath, coveringMove.toPath),
          parentId: topLevelMove ? targetDirectory.id : directory.parentId,
          updatedAt: new Date(),
          deletedAt: null,
        })
        .where(eq(workspaceDirectories.id, directory.id));
    }

    for (const move of allDocumentMoves) {
      await tx
        .update(documents)
        .set({
          directoryPath: move.toDirectoryPath,
          logicalPath: move.toLogicalPath,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, move.id));
    }
  });

  for (const move of allDocumentMoves) {
    await syncDocumentCitationMetadata({
      documentId: move.id,
      title: move.document.title,
      logicalPath: move.toLogicalPath,
    });
    await syncDocumentSearchIndex(move.id);
  }

  return {
    movedDirectoryCount: directoryMoves.length,
    movedDocumentCount: allDocumentMoves.length,
  };
}

export async function deleteKnowledgeLibraryEntries(input: {
  libraryId: string;
  directoryIds: string[];
  documentIds: string[];
}) {
  const db = getDb();
  const [selectedDirectories, selectedDocuments, allDirectories, allDocuments] = await Promise.all([
    input.directoryIds.length > 0
      ? db
          .select()
          .from(workspaceDirectories)
          .where(
            and(
              eq(workspaceDirectories.libraryId, input.libraryId),
              isNull(workspaceDirectories.deletedAt),
              inArray(workspaceDirectories.id, uniqueValues(input.directoryIds)),
            ),
          )
      : Promise.resolve([]),
    input.documentIds.length > 0
      ? db
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.libraryId, input.libraryId),
              inArray(documents.id, uniqueValues(input.documentIds)),
            ),
          )
      : Promise.resolve([]),
    db
      .select()
      .from(workspaceDirectories)
      .where(
        and(
          eq(workspaceDirectories.libraryId, input.libraryId),
          isNull(workspaceDirectories.deletedAt),
        ),
      ),
    db.select().from(documents).where(eq(documents.libraryId, input.libraryId)),
  ]);

  const compactedSelection = compactKnowledgeBaseSelection({
    directories: selectedDirectories.map((directory) => ({
      id: directory.id,
      path: directory.path,
      name: directory.name,
    })),
    documents: selectedDocuments.map((document) => ({
      id: document.id,
      logicalPath: document.logicalPath,
      directoryPath: document.directoryPath,
      sourceFilename: document.sourceFilename,
    })),
  });

  const deletedDirectoryIds = new Set<string>();
  const deletedDocumentIds = new Set<string>();

  for (const directory of compactedSelection.directories) {
    const matchingDirectories = allDirectories.filter((candidate) =>
      isSameOrDescendantPath(candidate.path, directory.path),
    );
    const matchingDocuments = allDocuments.filter((document) =>
      isSameOrDescendantPath(document.directoryPath, directory.path),
    );

    for (const candidate of matchingDirectories) {
      deletedDirectoryIds.add(candidate.id);
    }
    for (const document of matchingDocuments) {
      deletedDocumentIds.add(document.id);
    }
  }

  for (const document of compactedSelection.documents) {
    deletedDocumentIds.add(document.id);
  }

  await Promise.all(
    [...deletedDocumentIds].map((documentId) => deleteDocumentSearchIndexAndAssets(documentId)),
  );

  await db.transaction(async (tx) => {
    if (deletedDocumentIds.size > 0) {
      await tx
        .delete(documents)
        .where(inArray(documents.id, [...deletedDocumentIds]));
    }

    if (deletedDirectoryIds.size > 0) {
      await tx
        .update(workspaceDirectories)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(inArray(workspaceDirectories.id, [...deletedDirectoryIds]));
    }
  });

  return {
    deletedDirectoryCount: deletedDirectoryIds.size,
    deletedDocumentCount: deletedDocumentIds.size,
  };
}
