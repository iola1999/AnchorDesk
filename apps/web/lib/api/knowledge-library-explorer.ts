import { desc, eq, inArray, isNull } from "drizzle-orm";
import { RUN_STATUS } from "@anchordesk/contracts";

import {
  documentJobs,
  documentVersions,
  documents,
  getDb,
  knowledgeLibraries,
  workspaceDirectories,
} from "@anchordesk/db";

import {
  KNOWLEDGE_BASE_ROOT_PATH,
  normalizeDirectoryPath,
} from "@/lib/api/directory-paths";
import { ensureKnowledgeLibraryRootDirectory } from "@/lib/api/workspace-directories";

type DbLike = ReturnType<typeof getDb>;

export type KnowledgeLibraryExplorerDirectory = {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeLibraryExplorerDocument = {
  id: string;
  title: string;
  sourceFilename: string;
  logicalPath: string;
  directoryPath: string;
  mimeType: string;
  docType: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  latestVersion: {
    id: string;
    parseStatus: string;
    fileSizeBytes: number | null;
  } | null;
  latestJob: {
    id: string;
    status: string;
    stage: string;
    progress: number;
    updatedAt: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  } | null;
};

export async function loadKnowledgeLibraryExplorerData(input: {
  libraryId: string;
  path?: string | null;
  db?: DbLike;
}) {
  const db = input.db ?? getDb();
  await ensureKnowledgeLibraryRootDirectory(input.libraryId, db);

  const [library, docs, directories] = await Promise.all([
    db
      .select({
        id: knowledgeLibraries.id,
        workspaceId: knowledgeLibraries.workspaceId,
        title: knowledgeLibraries.title,
        slug: knowledgeLibraries.slug,
        description: knowledgeLibraries.description,
        status: knowledgeLibraries.status,
        libraryType: knowledgeLibraries.libraryType,
      })
      .from(knowledgeLibraries)
      .where(eq(knowledgeLibraries.id, input.libraryId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select()
      .from(documents)
      .where(eq(documents.libraryId, input.libraryId))
      .orderBy(desc(documents.createdAt)),
    db
      .select()
      .from(workspaceDirectories)
      .where(
        eq(workspaceDirectories.libraryId, input.libraryId),
      )
      .orderBy(workspaceDirectories.path),
  ]);

  if (!library) {
    throw new Error("Knowledge library not found");
  }

  const activeDirectories = directories.filter((directory) => !directory.deletedAt);
  const normalizedPath = normalizeDirectoryPath(input.path ?? KNOWLEDGE_BASE_ROOT_PATH);
  const currentDirectory =
    activeDirectories.find((directory) => directory.path === normalizedPath) ??
    activeDirectories.find((directory) => directory.path === KNOWLEDGE_BASE_ROOT_PATH) ??
    null;

  if (!currentDirectory) {
    throw new Error("Knowledge library root directory is missing");
  }

  const latestVersionIds = docs
    .map((doc) => doc.latestVersionId)
    .filter((value): value is string => Boolean(value));

  const [latestVersions, latestJobs] = await Promise.all([
    latestVersionIds.length > 0
      ? db
          .select()
          .from(documentVersions)
          .where(inArray(documentVersions.id, latestVersionIds))
      : Promise.resolve([]),
    latestVersionIds.length > 0
      ? db
          .select()
          .from(documentJobs)
          .where(inArray(documentJobs.documentVersionId, latestVersionIds))
      : Promise.resolve([]),
  ]);

  const versionById = new Map(latestVersions.map((version) => [version.id, version] as const));
  const jobByVersionId = new Map(latestJobs.map((job) => [job.documentVersionId, job] as const));
  const processingDocumentCount = docs.filter((doc) => {
    const latestVersion = doc.latestVersionId ? versionById.get(doc.latestVersionId) ?? null : null;
    const latestJob = latestVersion ? jobByVersionId.get(latestVersion.id) ?? null : null;

    return (
      latestJob?.status === RUN_STATUS.QUEUED ||
      latestJob?.status === RUN_STATUS.RUNNING ||
      latestJob?.status === RUN_STATUS.FAILED
    );
  }).length;

  return {
    library,
    currentDirectory: {
      id: currentDirectory.id,
      path: currentDirectory.path,
    },
    processingDocumentCount,
    directories: activeDirectories.map<KnowledgeLibraryExplorerDirectory>((directory) => ({
      id: directory.id,
      parentId: directory.parentId,
      name: directory.name,
      path: directory.path,
      createdAt: directory.createdAt.toISOString(),
      updatedAt: directory.updatedAt.toISOString(),
    })),
    documents: docs.map<KnowledgeLibraryExplorerDocument>((doc) => {
      const latestVersion = doc.latestVersionId ? versionById.get(doc.latestVersionId) ?? null : null;
      const latestJob = latestVersion ? jobByVersionId.get(latestVersion.id) ?? null : null;

      return {
        id: doc.id,
        title: doc.title,
        sourceFilename: doc.sourceFilename,
        logicalPath: doc.logicalPath,
        directoryPath: doc.directoryPath,
        mimeType: doc.mimeType,
        docType: doc.docType,
        tags: doc.tagsJson ?? [],
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        latestVersion: latestVersion
          ? {
              id: latestVersion.id,
              parseStatus: latestVersion.parseStatus,
              fileSizeBytes: latestVersion.fileSizeBytes ?? null,
            }
          : null,
        latestJob: latestJob
          ? {
              id: latestJob.id,
              status: latestJob.status,
              stage: latestJob.stage,
              progress: latestJob.progress,
              updatedAt: latestJob.updatedAt.toISOString(),
              errorCode: latestJob.errorCode,
              errorMessage: latestJob.errorMessage,
            }
          : null,
      };
    }),
  };
}
