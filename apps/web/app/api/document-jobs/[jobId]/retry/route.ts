import { eq } from "drizzle-orm";

import { documentJobs, documentVersions, documents, getDb } from "@knowledge-assistant/db";
import { enqueueIngestFlow } from "@knowledge-assistant/queue";

import { auth } from "@/auth";
import { requireOwnedDocumentJob } from "@/lib/guards/resources";

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

  const job = await requireOwnedDocumentJob(jobId, session.user.id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "failed") {
    return Response.json({ error: "Only failed jobs can be retried" }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(documentJobs)
    .set({
      stage: "queued",
      status: "queued",
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
      parseStatus: "queued",
    })
    .where(eq(documentVersions.id, job.documentVersionId));

  await db
    .update(documents)
    .set({
      status: "processing",
      updatedAt: new Date(),
    })
    .where(eq(documents.id, job.documentId));

  await enqueueIngestFlow({
    workspaceId: job.workspaceId,
    documentId: job.documentId,
    documentVersionId: job.documentVersionId,
  });

  return Response.json({ ok: true });
}
