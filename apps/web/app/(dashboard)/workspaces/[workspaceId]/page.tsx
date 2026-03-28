import Link from "next/link";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

import {
  conversations,
  getDb,
  messageCitations,
  messages,
  workspaces,
} from "@law-doc/db";

import { auth } from "@/auth";
import { Composer } from "@/components/chat/composer";
import { ConversationPageActions } from "@/components/chat/conversation-page-actions";
import { WorkspaceShell } from "@/components/workspaces/workspace-shell";
import { chooseWorkspaceConversationWithMeta } from "@/lib/api/conversations";

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
  const user = session?.user;
  const db = getDb();

  const [workspaceList, workspaceRows, conversationList] = await Promise.all([
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
        mode: conversations.mode,
        updatedAt: conversations.updatedAt,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(eq(conversations.workspaceId, workspaceId))
      .orderBy(desc(conversations.updatedAt), desc(conversations.createdAt)),
  ]);

  const workspace = workspaceRows[0];
  if (!workspace || !user) {
    notFound();
  }

  const activeConversation = chooseWorkspaceConversationWithMeta(
    conversationList,
    requestedConversationId,
  );

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

  return (
    <WorkspaceShell
      workspace={{
        id: workspace.id,
        title: workspace.title,
      }}
      workspaces={workspaceList}
      conversations={conversationList}
      activeConversationId={activeConversation?.id}
      currentUser={{
        name: user.name,
        username: user.username,
      }}
      breadcrumbs={[
        { label: "空间", href: "/workspaces" },
        { label: workspace.title },
      ]}
      topActions={
        activeConversation ? (
          <ConversationPageActions
            conversationId={activeConversation.id}
            workspaceId={workspaceId}
          />
        ) : undefined
      }
    >
      {activeConversation ? (
        <div className="conversation-stage">
          <div className="conversation-stage-panel">
            <header className="conversation-stage-header">
              <div className="stack">
                <p className="workspace-panel-eyebrow">Conversation</p>
                <h1>{activeConversation.title}</h1>
                <p className="muted">
                  当前会话持续沉淀在 {workspace.title} 里，引用会继续指向该空间下的资料。
                </p>
              </div>
            </header>

            <div className="conversation-thread">
              {thread.length > 0 ? (
                thread.map((message) => (
                  <article
                    key={message.id}
                    className={`conversation-bubble conversation-bubble-${message.role}`}
                  >
                    <div className="conversation-bubble-head">
                      <strong>
                        {message.role === "assistant"
                          ? "AI 助手"
                          : message.role === "user"
                            ? "你"
                            : message.role}
                      </strong>
                      <span className="muted">{message.status}</span>
                    </div>
                    <div className="conversation-bubble-body">{message.contentMarkdown}</div>
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
                <div className="conversation-empty muted">
                  这一轮还没有消息，从底部输入框继续提问。
                </div>
              )}
            </div>

            <div className="conversation-composer-wrap">
              <Composer
                conversationId={activeConversation.id}
                workspaceId={workspaceId}
                variant="stage"
                rows={4}
                title="继续提问"
                description="上下文会沿用本轮会话，不需要重复描述已经上传的资料。"
                placeholder="继续追问、要求整理成结论，或让助手基于资料补充论证。"
                submitLabel="发送"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="new-question-stage">
          <div className="new-question-stage-panel">
            <div className="new-question-stage-copy">
              <p className="workspace-panel-eyebrow">New Question</p>
              <h1>{workspace.title}</h1>
              <p className="muted">
                先把要解决的问题直接写出来。资料库维护、上传和空间名称调整，都统一收到左侧“当前空间设置”里。
              </p>
            </div>

            <div className="new-question-stage-composer">
              <Composer
                workspaceId={workspaceId}
                variant="stage"
                rows={8}
                title="输入 / 粘贴你的问题"
                description="提交第一轮问题后，系统会自动创建会话，并把后续回答沉淀到左侧历史里。"
                placeholder="例如：请基于本空间资料，对供应合同中的违约责任和终止条款做风险审查，并列出仍需补充的事实。"
                submitLabel="开始对话"
              />
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
