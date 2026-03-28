import Link from "next/link";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

import {
  conversations,
  documentJobs,
  documentVersions,
  documents,
  getDb,
  messageCitations,
  messages,
  reports,
  workspaces,
} from "@law-doc/db";

import { Composer } from "@/components/chat/composer";
import { ConversationActions } from "@/components/chat/conversation-actions";
import { CreateConversationButton } from "@/components/chat/create-conversation-button";
import { CreateReportForm } from "@/components/reports/create-report-form";
import { WorkspaceAutoRefresh } from "@/components/workspaces/auto-refresh";
import { DocumentTreePanel } from "@/components/workspaces/document-tree-panel";
import { ManualRefreshButton } from "@/components/workspaces/manual-refresh-button";
import { RetryDocumentJobButton } from "@/components/workspaces/retry-document-job-button";
import { UploadForm } from "@/components/workspaces/upload-form";
import { auth } from "@/auth";
import {
  chooseWorkspaceConversationWithMeta,
  formatConversationUpdatedAt,
  groupWorkspaceConversationsWithMeta,
} from "@/lib/api/conversations";
import { canRetryDocumentJob, describeDocumentJobFailure } from "@/lib/api/document-jobs";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const { workspaceId } = await params;
  const { conversationId: requestedConversationId } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const db = getDb();

  const [workspace, docs, conversationList, reportList] = await Promise.all([
    db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
      .limit(1),
    db
      .select()
      .from(documents)
      .where(eq(documents.workspaceId, workspaceId))
      .orderBy(desc(documents.createdAt)),
    db
      .select()
      .from(conversations)
      .where(eq(conversations.workspaceId, workspaceId))
      .orderBy(desc(conversations.updatedAt), desc(conversations.createdAt)),
    db
      .select()
      .from(reports)
      .where(eq(reports.workspaceId, workspaceId))
      .orderBy(desc(reports.updatedAt), desc(reports.createdAt))
      .limit(8),
  ]);

  if (!workspace[0]) {
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
  const jobByVersionId = new Map(
    latestJobs.map((job) => [job.documentVersionId, job]),
  );

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

  const activeConversation = chooseWorkspaceConversationWithMeta(
    conversationList,
    requestedConversationId,
  );
  const groupedConversations = groupWorkspaceConversationsWithMeta(conversationList);

  const thread = activeConversation
    ? await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, activeConversation.id))
        .orderBy(asc(messages.createdAt))
    : [];

  const citations =
    thread.length > 0
      ? await db
          .select()
          .from(messageCitations)
          .where(inArray(messageCitations.messageId, thread.map((message) => message.id)))
          .orderBy(asc(messageCitations.ordinal))
      : [];

  const citationsByMessage = new Map<string, Array<(typeof citations)[number]>>();
  for (const citation of citations) {
    const group = citationsByMessage.get(citation.messageId) ?? [];
    group.push(citation);
    citationsByMessage.set(citation.messageId, group);
  }

  const hasActiveJobs = docsWithProgress.some(
    (doc) =>
      doc.latestJob?.status === "queued" ||
      doc.latestJob?.status === "running" ||
      (doc.latestVersion && doc.latestVersion.parseStatus !== "ready" && doc.latestVersion.parseStatus !== "failed"),
  );

  return (
    <div className="stack">
      <WorkspaceAutoRefresh enabled={hasActiveJobs} />
      <div className="toolbar">
        <div>
          <h1>{workspace[0].title}</h1>
          <p className="muted">{workspace[0].description || "暂无描述"}</p>
        </div>
      </div>

      <div className="grid two">
        <div className="stack">
          <div className="card stack">
            <div className="toolbar">
              <h3>对话</h3>
              <CreateConversationButton workspaceId={workspaceId} />
            </div>
            {conversationList.length > 0 ? (
              <div className="stack">
                <section className="stack conversation-section">
                  <div className="toolbar">
                    <strong>活跃会话</strong>
                    <span className="muted">{groupedConversations.active.length} 个</span>
                  </div>
                  {groupedConversations.active.length > 0 ? (
                    <div className="conversation-list">
                      {groupedConversations.active.map((item) => (
                        <div
                          key={item.id}
                          className={`conversation-link${item.id === activeConversation?.id ? " is-active" : ""}`}
                        >
                          <Link href={`/workspaces/${workspaceId}?conversationId=${item.id}`}>
                            <strong>{item.title}</strong>
                            <span className="muted">
                              {item.mode} · 最近访问 {formatConversationUpdatedAt(item.updatedAt)}
                            </span>
                          </Link>
                          <ConversationActions
                            conversationId={item.id}
                            workspaceId={workspaceId}
                            title={item.title}
                            status={item.status}
                            isActive={item.id === activeConversation?.id}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">当前没有活跃会话。</p>
                  )}
                </section>
                <section className="stack conversation-section">
                  <div className="toolbar">
                    <strong>已归档</strong>
                    <span className="muted">{groupedConversations.archived.length} 个</span>
                  </div>
                  {groupedConversations.archived.length > 0 ? (
                    <div className="conversation-list">
                      {groupedConversations.archived.map((item) => (
                        <div
                          key={item.id}
                          className={`conversation-link${item.id === activeConversation?.id ? " is-active" : ""}`}
                        >
                          <Link href={`/workspaces/${workspaceId}?conversationId=${item.id}`}>
                            <strong>{item.title}</strong>
                            <span className="muted">
                              已归档 · 最近访问 {formatConversationUpdatedAt(item.updatedAt)}
                            </span>
                          </Link>
                          <ConversationActions
                            conversationId={item.id}
                            workspaceId={workspaceId}
                            title={item.title}
                            status={item.status}
                            isActive={item.id === activeConversation?.id}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">当前没有归档会话。</p>
                  )}
                </section>
              </div>
            ) : (
              <div className="empty-state">
                <p>当前还没有对话。</p>
                <p className="muted">先创建一个对话，再开始基于知识库提问。</p>
              </div>
            )}
          </div>

          {activeConversation ? (
            <>
              <div className="card stack">
                <div className="toolbar">
                  <h3>当前对话</h3>
                  <span className="muted">
                    {activeConversation.title} · {activeConversation.mode} · 最近访问{" "}
                    {formatConversationUpdatedAt(activeConversation.updatedAt)}
                  </span>
                </div>
                <div className="thread">
                  {thread.length > 0 ? (
                    thread.map((message) => (
                      <article key={message.id} className="message-card">
                        <div className="message-meta">
                          <strong>
                            {message.role === "assistant"
                              ? "AI 助手"
                              : message.role === "user"
                                ? "你"
                                : message.role}
                          </strong>
                          <span className="muted">{message.status}</span>
                        </div>
                        <div>{message.contentMarkdown}</div>
                        {(citationsByMessage.get(message.id) ?? []).length > 0 ? (
                          <div className="citation-list">
                            {(citationsByMessage.get(message.id) ?? []).map((citation) => (
                              <Link
                                key={citation.id}
                                href={`/workspaces/${workspaceId}/documents/${citation.documentId}?anchorId=${citation.anchorId}`}
                                className="citation-link"
                              >
                                {citation.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <p className="muted">还没有消息。</p>
                  )}
                </div>
              </div>
              <Composer conversationId={activeConversation.id} />
            </>
          ) : (
            <div className="card">
              <p>先创建一个对话。</p>
              <p className="muted">创建后即可在当前工作空间中提问和沉淀回答记录。</p>
            </div>
          )}

          <DocumentTreePanel
            workspaceId={workspaceId}
            documents={docsWithProgress.map((doc) => ({
              id: doc.id,
              title: doc.title,
              logicalPath: doc.logicalPath,
              docType: doc.docType,
              tags: doc.tagsJson ?? [],
            }))}
          />
        </div>

        <div className="stack">
          <UploadForm workspaceId={workspaceId} />
          <CreateReportForm
            workspaceId={workspaceId}
            conversationId={activeConversation?.id}
          />
          <div className="card">
            <div className="toolbar">
              <h3>处理队列</h3>
              <ManualRefreshButton />
            </div>
            <ul className="list">
              {docsWithProgress
                .filter((doc) => doc.latestJob || doc.status !== "ready")
                .slice(0, 6)
                .map((doc) => (
                  <li key={doc.id}>
                    <div className="stack">
                      <div>
                        <Link href={`/workspaces/${workspaceId}/documents/${doc.id}`}>
                          <strong>{doc.title}</strong>
                        </Link>
                        <span className="muted">
                          {" "}
                          · {doc.latestJob?.stage ?? doc.latestVersion?.parseStatus ?? doc.status}
                          {doc.latestJob ? ` · ${doc.latestJob.progress}%` : ""}
                        </span>
                      </div>
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
                        <RetryDocumentJobButton jobId={doc.latestJob.id} />
                      ) : null}
                    </div>
                  </li>
                ))}
              {docsWithProgress.filter((doc) => doc.latestJob || doc.status !== "ready")
                .length === 0 ? <li className="muted">当前没有进行中的处理任务。</li> : null}
            </ul>
          </div>
          <div className="card">
            <div className="toolbar">
              <h3>最近报告</h3>
            </div>
            {reportList.length > 0 ? (
              <ul className="list">
                {reportList.map((report) => (
                  <li key={report.id}>
                    <Link href={`/workspaces/${workspaceId}/reports/${report.id}`}>
                      {report.title}
                    </Link>
                    <span className="muted"> · {report.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">当前还没有报告。</p>
            )}
          </div>
          <div className="card">
            <h3>最近文档</h3>
            <ul className="list">
              {docsWithProgress.slice(0, 5).map((doc) => (
                <li key={doc.id}>
                  {doc.title}{" "}
                  <span className="muted">
                    ({doc.latestJob?.stage ?? doc.latestVersion?.parseStatus ?? doc.status}
                    {doc.latestJob ? ` · ${doc.latestJob.progress}%` : ""})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
