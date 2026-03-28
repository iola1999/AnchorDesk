import Link from "next/link";
import type { ReactNode } from "react";

import { isSuperAdminUsername } from "@/lib/auth/super-admin";

type WorkspaceListItem = {
  id: string;
  title: string;
};

type ConversationListItem = {
  id: string;
  title: string;
  status: "active" | "archived";
  updatedAt: Date;
};

type WorkspaceShellProps = {
  workspace: WorkspaceListItem;
  workspaces: WorkspaceListItem[];
  conversations: ConversationListItem[];
  activeConversationId?: string;
  activeView?: "chat" | "settings";
  currentUser: {
    name?: string | null;
    username: string;
  };
  breadcrumbs: Array<{ label: string; href?: string }>;
  topActions?: ReactNode;
  children: ReactNode;
};

function formatSidebarDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function WorkspaceShell({
  workspace,
  workspaces,
  conversations,
  activeConversationId,
  activeView = "chat",
  currentUser,
  breadcrumbs,
  topActions,
  children,
}: WorkspaceShellProps) {
  const activeConversations = conversations.filter((item) => item.status === "active");
  const archivedConversations = conversations.filter((item) => item.status === "archived");
  const canAccessSystemSettings = isSuperAdminUsername(currentUser.username);
  const displayName = currentUser.name ?? currentUser.username;
  const avatarLabel = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="assistant-shell">
      <aside className="assistant-sidebar">
        <div className="assistant-sidebar-top">
          <Link href="/workspaces" className="assistant-brand">
            <span className="assistant-brand-mark">LA</span>
            <span className="assistant-brand-copy">
              <strong>Legal AI</strong>
              <span>Assistant Workspace</span>
            </span>
          </Link>
          <Link
            href={`/workspaces/${workspace.id}`}
            className={`assistant-new-question${
              activeView === "chat" && !activeConversationId ? " is-current" : ""
            }`}
          >
            新建问题
          </Link>
        </div>

        <div className="assistant-sidebar-section">
          <div className="assistant-sidebar-label">当前空间</div>
          <div className="assistant-space-card">
            <strong>{workspace.title}</strong>
            <span className="muted">顶部导航可切换其他空间</span>
          </div>
        </div>

        <div className="assistant-sidebar-section assistant-history-section">
          <div className="assistant-sidebar-heading">
            <span>历史会话</span>
            <span className="assistant-sidebar-count">{activeConversations.length}</span>
          </div>
          <div className="assistant-history-list">
            {activeConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/workspaces/${workspace.id}?conversationId=${conversation.id}`}
                className={`assistant-history-item${
                  conversation.id === activeConversationId ? " is-active" : ""
                }`}
              >
                <div className="assistant-history-item-copy">
                  <strong>{conversation.title}</strong>
                  <span className="muted">继续当前会话</span>
                </div>
                <span className="assistant-history-date">
                  {formatSidebarDate(conversation.updatedAt)}
                </span>
              </Link>
            ))}
            {activeConversations.length === 0 ? (
              <div className="assistant-history-empty muted">当前还没有历史会话。</div>
            ) : null}
          </div>
        </div>

        <div
          className={`assistant-sidebar-section assistant-settings-group${
            activeView === "settings" ? " is-active" : ""
          }`}
        >
          <div className="assistant-sidebar-heading">
            <span>当前空间设置</span>
            {archivedConversations.length > 0 ? (
              <span className="assistant-sidebar-meta">已归档 {archivedConversations.length}</span>
            ) : null}
          </div>
          <nav className="assistant-settings-nav">
            <Link href={`/workspaces/${workspace.id}/settings`}>空间信息</Link>
            <Link href={`/workspaces/${workspace.id}/settings#knowledge-base`}>
              资料库与上传
            </Link>
          </nav>
        </div>

        <div className="assistant-sidebar-footer">
          <div className="assistant-user-badge">{avatarLabel}</div>
          <div className="assistant-user-meta">
            <strong>{displayName}</strong>
            <span className="muted">@{currentUser.username}</span>
          </div>
          <div className="assistant-user-links">
            <Link href="/workspaces">切换空间</Link>
            {canAccessSystemSettings ? <Link href="/settings">系统设置</Link> : null}
          </div>
        </div>
      </aside>

      <section className="assistant-main">
        <header className="assistant-topbar">
          <div className="assistant-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={`${item.label}-${index}`} className="assistant-breadcrumb-item">
                {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
                {index < breadcrumbs.length - 1 ? <span> / </span> : null}
              </span>
            ))}
          </div>

          <div className="assistant-topbar-actions">
            <details className="assistant-space-switcher">
              <summary>
                <span className="assistant-space-switcher-label">当前空间</span>
                <strong>{workspace.title}</strong>
              </summary>
              <div className="assistant-space-switcher-menu">
                {workspaces.map((item) => (
                  <Link key={item.id} href={`/workspaces/${item.id}`}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </details>
            {topActions}
          </div>
        </header>

        <div className="assistant-main-body">{children}</div>
      </section>
    </div>
  );
}
