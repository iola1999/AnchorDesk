import { eq } from "drizzle-orm";
import {
  DEFAULT_PARSE_STATUS,
  DEFAULT_DOCUMENT_INDEXING_MODE,
  DOCUMENT_STATUS,
  KNOWLEDGE_LIBRARY_TYPE,
  RUN_STATUS,
  type DocumentIndexingMode,
} from "@anchordesk/contracts";

import {
  documentJobs,
  documentVersions,
  documents,
  getDb,
  knowledgeLibraries,
} from "@anchordesk/db";
import { enqueueIngestFlow } from "@anchordesk/queue";

import { auth } from "@/auth";
import { requireOwnedDocumentJob } from "@/lib/guards/resources";
import { isSuperAdminUsername } from "@/lib/auth/super-admin";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job =
    (await requireOwnedDocumentJob(jobId, session.user.id)) ??
    (isSuperAdminUsername(session.user.username)
      ? await getDb()
          .select({
            id: documentJobs.id,
            documentVersionId: documentJobs.documentVersionId,
            stage: documentJobs.stage,
            status: documentJobs.status,
            progress: documentJobs.progress,
            metadataJson: documentVersions.metadataJson,
            errorCode: documentJobs.errorCode,
            errorMessage: documentJobs.errorMessage,
            createdAt: documentJobs.createdAt,
            updatedAt: documentJobs.updatedAt,
            startedAt: documentJobs.startedAt,
            finishedAt: documentJobs.finishedAt,
            libraryId: documents.libraryId,
            workspaceId: documents.workspaceId,
            documentId: documents.id,
            libraryType: knowledgeLibraries.libraryType,
          })
          .from(documentJobs)
          .innerJoin(
            documentVersions,
            eq(documentVersions.id, documentJobs.documentVersionId),
          )
          .innerJoin(documents, eq(documents.id, documentVersions.documentId))
          .leftJoin(knowledgeLibraries, eq(knowledgeLibraries.id, documents.libraryId))
          .where(eq(documentJobs.id, jobId))
          .limit(1)
          .then((rows) => {
            const row = rows[0] ?? null;
            if (!row || row.libraryType !== KNOWLEDGE_LIBRARY_TYPE.GLOBAL_MANAGED) {
              return null;
            }

            return row;
          })
      : null);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== RUN_STATUS.FAILED) {
    return Response.json({ error: "Only failed jobs can be retried" }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(documentJobs)
    .set({
      stage: DEFAULT_PARSE_STATUS,
      status: RUN_STATUS.QUEUED,
      progress: 0,
      errorCode: null,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(documentJobs.id, jobId));

  await db
    .update(documentVersions)
    .set({
      parseStatus: DEFAULT_PARSE_STATUS,
    })
    .where(eq(documentVersions.id, job.documentVersionId));

  await db
    .update(documents)
    .set({
      status: DOCUMENT_STATUS.PROCESSING,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, job.documentId));

  const indexingMode =
    typeof job.metadataJson?.indexing_mode === "string"
      ? (job.metadataJson.indexing_mode as DocumentIndexingMode)
      : DEFAULT_DOCUMENT_INDEXING_MODE;

  await enqueueIngestFlow({
    workspaceId: job.workspaceId ?? null,
    libraryId: job.libraryId ?? undefined,
    documentId: job.documentId,
    documentVersionId: job.documentVersionId,
    indexingMode,
  });

  return Response.json({ ok: true });
}
