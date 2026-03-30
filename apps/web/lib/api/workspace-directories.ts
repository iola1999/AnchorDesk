import { eq, and } from "drizzle-orm";

import {
  ensureWorkspacePrivateLibrary,
  getDb,
  knowledgeLibraries,
  workspaceDirectories,
} from "@anchordesk/db";

import {
  getDirectoryName,
  getParentDirectoryPath,
  listAncestorDirectoryPaths,
  normalizeDirectoryPath,
} from "./directory-paths";

type DirectoryDb = ReturnType<typeof getDb>;
type WorkspaceDirectoryRecord = typeof workspaceDirectories.$inferSelect;

async function resolveKnowledgeLibraryWorkspaceId(
  libraryId: string,
  db: DirectoryDb,
) {
  const [library] = await db
    .select({
      workspaceId: knowledgeLibraries.workspaceId,
    })
    .from(knowledgeLibraries)
    .where(eq(knowledgeLibraries.id, libraryId))
    .limit(1);

  if (!library) {
    throw new Error("资料库不存在");
  }

  return library.workspaceId ?? null;
}

export async function ensureKnowledgeLibraryDirectoryPath(
  input: {
    libraryId: string;
    path: string;
    workspaceId?: string | null;
  },
  db: DirectoryDb = getDb(),
) {
  const normalizedPath = normalizeDirectoryPath(input.path);
  const ancestors = listAncestorDirectoryPaths(normalizedPath);
  const workspaceId =
    input.workspaceId !== undefined
      ? input.workspaceId
      : await resolveKnowledgeLibraryWorkspaceId(input.libraryId, db);
  let parentId: string | null = null;
  let currentDirectory: WorkspaceDirectoryRecord | null = null;

  for (const ancestorPath of ancestors) {
    const name = getDirectoryName(ancestorPath);
    const rows: WorkspaceDirectoryRecord[] =
      workspaceId !== null
        ? await db
            .insert(workspaceDirectories)
            .values({
              libraryId: input.libraryId,
              workspaceId,
              parentId,
              name,
              path: ancestorPath,
              deletedAt: null,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [workspaceDirectories.workspaceId, workspaceDirectories.path],
              set: {
                libraryId: input.libraryId,
                parentId,
                name,
                deletedAt: null,
                updatedAt: new Date(),
              },
            })
            .returning()
        : await db
            .insert(workspaceDirectories)
            .values({
              libraryId: input.libraryId,
              workspaceId: null,
              parentId,
              name,
              path: ancestorPath,
              deletedAt: null,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [workspaceDirectories.libraryId, workspaceDirectories.path],
              set: {
                workspaceId: null,
                parentId,
                name,
                deletedAt: null,
                updatedAt: new Date(),
              },
            })
            .returning();
    const directory = rows[0] ?? null;

    if (!directory) {
      continue;
    }

    currentDirectory = directory;
    parentId = directory.id;
  }

  return currentDirectory;
}

export async function ensureWorkspaceDirectoryPath(
  workspaceId: string,
  path: string,
  db: DirectoryDb = getDb(),
) {
  const privateLibrary = await ensureWorkspacePrivateLibrary(workspaceId, db);

  return ensureKnowledgeLibraryDirectoryPath(
    {
      libraryId: privateLibrary.id,
      workspaceId,
      path,
    },
    db,
  );
}

export async function findWorkspaceDirectoryByPath(
  workspaceId: string,
  path: string,
  db: DirectoryDb = getDb(),
) {
  const normalizedPath = normalizeDirectoryPath(path);
  const rows = await db
    .select()
    .from(workspaceDirectories)
    .where(
      and(
        eq(workspaceDirectories.workspaceId, workspaceId),
        eq(workspaceDirectories.path, normalizedPath),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function findKnowledgeLibraryDirectoryByPath(
  libraryId: string,
  path: string,
  db: DirectoryDb = getDb(),
) {
  const normalizedPath = normalizeDirectoryPath(path);
  const rows = await db
    .select()
    .from(workspaceDirectories)
    .where(
      and(
        eq(workspaceDirectories.libraryId, libraryId),
        eq(workspaceDirectories.path, normalizedPath),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function ensureWorkspaceRootDirectory(
  workspaceId: string,
  db: DirectoryDb = getDb(),
) {
  return ensureWorkspaceDirectoryPath(workspaceId, "资料库", db);
}

export async function ensureKnowledgeLibraryRootDirectory(
  libraryId: string,
  db: DirectoryDb = getDb(),
) {
  return ensureKnowledgeLibraryDirectoryPath(
    {
      libraryId,
      path: "资料库",
    },
    db,
  );
}

export async function restoreWorkspaceDirectoryAncestors(
  workspaceId: string,
  path: string,
  db: DirectoryDb = getDb(),
) {
  const normalizedPath = normalizeDirectoryPath(path);
  const parentPath = getParentDirectoryPath(normalizedPath);

  if (!parentPath) {
    return ensureWorkspaceDirectoryPath(workspaceId, normalizedPath, db);
  }

  await ensureWorkspaceDirectoryPath(workspaceId, parentPath, db);
  return ensureWorkspaceDirectoryPath(workspaceId, normalizedPath, db);
}
