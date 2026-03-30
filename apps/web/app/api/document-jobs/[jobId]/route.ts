import { auth } from "@/auth";
import {
  requireOwnedDocumentJob,
  requireSuperAdminManagedDocumentJob,
} from "@/lib/guards/resources";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const runtime = "nodejs";

export async function GET(
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
    (isSuperAdmin(session.user)
      ? await requireSuperAdminManagedDocumentJob(jobId)
      : null);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({ job });
}
