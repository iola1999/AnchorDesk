import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

import {
  conversations,
  documentJobs,
  documentVersions,
  documents,
  getDb,
  workspaces,
} from "@law-doc/db";

import { auth } from "@/auth";
import { DocumentTreePanel } from "@/components/workspaces/document-tree-panel";
import { ManualRefreshButton } from "@/components/workspaces/manual-refresh-button";
import { UploadForm } from "@/components/workspaces/upload-form";
import { WorkspaceSettingsForm } from "@/components/workspaces/workspace-settings-form";
import { WorkspaceShell } from "@/components/workspaces/workspace-shell";
import { canRetryDocumentJob, describeDocumentJobFailure } from "@/lib/api/document-jobs";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const user = session?.user;
  const db = getDb();

  const [workspaceList, workspaceRows, conversationList, docs] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        title: workspaces.title,
      })
      .from(workspaces)
      .where(eq(workspaces.userId, userId))
      .orderBy(desc(workspaces.updatedAt), desc(workspaces.createdAt)),
    db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
      .limit(1),
    db
      .select({
        id: conversations.id,
        title: conversations.title,
        status: conversations.status,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(eq(conversations.workspaceId, workspaceId))
      .orderBy(desc(conversations.updatedAt), desc(conversations.createdAt)),
    db
      .select()
      .from(documents)
      .where(eq(documents.workspaceId, workspaceId))
      .orderBy(desc(documents.createdAt)),
  ]);

  const workspace = workspaceRows[0];
  if (!workspace || !user) {
    notFound();
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
      doc.latestJob?.status === "queued" ||
      doc.latestJob?.status === "running" ||
      doc.latestJob?.status === "failed",
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
      activeView="settings"
      breadcrumbs={[
        { label: "空间", href: "/workspaces" },
        { label: workspace.title, href: `/workspaces/${workspace.id}` },
        { label: "设置" },
      ]}
    >
      <div className="workspace-settings-page">
        <section className="workspace-settings-hero">
          <div className="stack">
            <p className="workspace-panel-eyebrow">Workspace Settings</p>
            <h1>当前空间设置</h1>
            <p className="muted">
              这里集中维护空间名称、资料库和上传入口。主对话页只保留问答本身，不再混放后台功能。
            </p>
          </div>
          <div className="workspace-settings-anchor-nav">
            <Link href="#general">空间信息</Link>
            <Link href="#knowledge-base">资料库</Link>
          </div>
        </section>

        <div className="workspace-settings-grid">
          <WorkspaceSettingsForm
            sectionId="general"
            workspaceId={workspace.id}
            initialTitle={workspace.title}
            initialDescription={workspace.description}
            initialIndustry={workspace.industry}
          />

          <section id="knowledge-base" className="workspace-settings-card stack">
            <div className="workspace-settings-header">
              <div className="stack">
                <p className="workspace-panel-eyebrow">Knowledge Base</p>
                <h2>资料库</h2>
                <p className="muted">
                  上传、查看和追踪当前空间中的资料处理状态。所有资料管理都以当前空间为边界。
                </p>
              </div>
              <ManualRefreshButton />
            </div>

            <UploadForm workspaceId={workspace.id} />

            <div className="workspace-settings-subgrid">
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

              <div className="workspace-settings-subsection stack">
                <h3>处理中的资料</h3>
                {processingDocs.length > 0 ? (
                  <div className="workspace-settings-doc-list">
                    {processingDocs.map((doc) => (
                      <div key={doc.id} className="workspace-settings-doc-item">
                        <Link href={`/workspaces/${workspace.id}/documents/${doc.id}`}>
                          <strong>{doc.title}</strong>
                        </Link>
                        <span className="muted">
                          {doc.latestJob?.stage ?? doc.latestVersion?.parseStatus ?? doc.status}
                          {doc.latestJob ? ` · ${doc.latestJob.progress}%` : ""}
                        </span>
                        {doc.latestJob?.status === "failed" ? (
                          <p className="error">
                            {describeDocumentJobFailure({
                              stage: doc.latestJob.stage,
                              errorCode: doc.latestJob.errorCode,
                              errorMessage: doc.latestJob.errorMessage,
                            })}
                          </p>
                        ) : null}
                        {doc.latestJob && canRetryDocumentJob(doc.latestJob) ? (
                          <div className="muted">可在文档详情页或任务入口继续重试。</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">当前没有正在处理或失败的资料任务。</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
