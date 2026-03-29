import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { RUN_STATUS } from "@knowledge-assistant/contracts";

import { documentJobs, documentVersions, documents, getDb } from "@knowledge-assistant/db";

import { DocumentTreePanel } from "@/components/workspaces/document-tree-panel";
import { ManualRefreshButton } from "@/components/workspaces/manual-refresh-button";
import { UploadForm } from "@/components/workspaces/upload-form";
import { WorkspaceShell } from "@/components/workspaces/workspace-shell";
import { canRetryDocumentJob, describeDocumentJobFailure } from "@/lib/api/document-jobs";
import { loadWorkspaceShellData } from "@/lib/api/workspace-shell-data";
import { cn, ui } from "@/lib/ui";

export default async function WorkspaceKnowledgeBasePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { workspace, workspaceList, conversationList, user } =
    await loadWorkspaceShellData(workspaceId);
  const db = getDb();

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId))
    .orderBy(desc(documents.createdAt));

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

  const versionById = new Map(latestVersions.map((version) => [version.id, version]));
  const jobByVersionId = new Map(latestJobs.map((job) => [job.documentVersionId, job]));

  const docsWithProgress = docs.map((doc) => {
    const latestVersion = doc.latestVersionId
      ? versionById.get(doc.latestVersionId) ?? null
      : null;
    const latestJob = latestVersion ? jobByVersionId.get(latestVersion.id) ?? null : null;

    return {
      ...doc,
      latestVersion,
      latestJob,
    };
  });

  const processingDocs = docsWithProgress.filter(
    (doc) =>
      doc.latestJob?.status === RUN_STATUS.QUEUED ||
      doc.latestJob?.status === RUN_STATUS.RUNNING ||
      doc.latestJob?.status === RUN_STATUS.FAILED,
  );

  return (
    <WorkspaceShell
      workspace={{
        id: workspace.id,
        title: workspace.title,
      }}
      workspaces={workspaceList}
      conversations={conversationList}
      currentUser={{
        name: user.name,
        username: user.username,
      }}
      activeView="knowledge-base"
      breadcrumbs={[
        { label: "空间", href: "/workspaces" },
        { label: workspace.title, href: `/workspaces/${workspace.id}` },
        { label: "资料库" },
      ]}
    >
      <div className="mx-auto grid w-full max-w-[1080px] gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
          <h1>资料库</h1>
          <ManualRefreshButton />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
          <div className="grid gap-4">
            <UploadForm workspaceId={workspace.id} />

            <DocumentTreePanel
              workspaceId={workspace.id}
              documents={docsWithProgress.map((doc) => ({
                id: doc.id,
                title: doc.title,
                logicalPath: doc.logicalPath,
                docType: doc.docType,
                tags: doc.tagsJson ?? [],
              }))}
            />
          </div>

          <section className={cn(ui.subcard, "grid content-start gap-4")}>
            <div className="grid gap-1">
              <h2 className="text-base font-semibold">处理中的资料</h2>
            </div>

            {processingDocs.length > 0 ? (
              <div className="grid gap-3">
                {processingDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid gap-2 rounded-2xl border border-app-border bg-white/82 p-4"
                  >
                    <Link
                      href={`/workspaces/${workspace.id}/documents/${doc.id}`}
                      className="font-medium hover:text-app-accent"
                    >
                      <strong>{doc.title}</strong>
                    </Link>
                    <span className={ui.muted}>
                      {doc.latestJob?.stage ?? doc.latestVersion?.parseStatus ?? doc.status}
                      {doc.latestJob ? ` · ${doc.latestJob.progress}%` : ""}
                    </span>
                    {doc.latestJob?.status === RUN_STATUS.FAILED ? (
                      <p className={ui.error}>
                        {describeDocumentJobFailure({
                          stage: doc.latestJob.stage,
                          errorCode: doc.latestJob.errorCode,
                          errorMessage: doc.latestJob.errorMessage,
                        })}
                      </p>
                    ) : null}
                    {doc.latestJob && canRetryDocumentJob(doc.latestJob) ? (
                      <div className={cn(ui.muted, "text-[13px] leading-5")}>
                        可在文档详情页或任务入口继续重试。
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className={ui.muted}>当前没有正在处理或失败的资料任务</p>
            )}
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
