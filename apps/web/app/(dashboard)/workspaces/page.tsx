import Link from "next/link";
import { eq } from "drizzle-orm";

import { getDb, users, workspaces } from "@law-doc/db";

import { auth } from "@/auth";
import { isSuperAdminUsername } from "@/lib/auth/super-admin";

export default async function WorkspacesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const db = getDb();

  const workspaceList = userId
    ? await db.select().from(workspaces).where(eq(workspaces.userId, userId))
    : [];
  const userRecord = userId
    ? await db.select().from(users).where(eq(users.id, userId)).limit(1)
    : [];
  const username = session?.user?.username ?? "";
  const displayName = session?.user?.name ?? userRecord[0]?.displayName ?? "用户";
  const canAccessSystemSettings = isSuperAdminUsername(username);

  return (
    <div className="workspace-selector-page">
      <div className="workspace-selector-hero">
        <div className="workspace-selector-copy stack">
          <p className="workspace-panel-eyebrow">Spaces</p>
          <h1>先选择要进入的空间</h1>
          <p className="muted">
            欢迎，{displayName}。问答、资料和历史会话都以空间为边界，登录后先进入一个具体空间再开始工作。
          </p>
        </div>

        <div className="workspace-selector-actions">
          <Link href="/workspaces/new" className="assistant-primary-link">
            新建工作空间
          </Link>
          {canAccessSystemSettings ? (
            <Link href="/settings" className="assistant-secondary-link">
              系统设置
            </Link>
          ) : null}
        </div>
      </div>

      <div className="workspace-selector-grid">
        {workspaceList.length ? (
          workspaceList.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="workspace-selector-card"
            >
              <div className="workspace-selector-card-top">
                <span className="workspace-selector-mark">空</span>
                <span className="workspace-selector-open">进入空间</span>
              </div>
              <div className="stack">
                <strong>{workspace.title}</strong>
                <p className="muted">{workspace.description || "暂无描述"}</p>
              </div>
              <div className="workspace-selector-meta muted">
                <span>{workspace.defaultMode === "kb_plus_web" ? "资料 + 联网" : "仅资料"}</span>
                <span>{workspace.allowWebSearch ? "允许联网" : "默认本地"}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="workspace-selector-empty">
            <p>还没有工作空间，先创建一个空间再开始问答。</p>
          </div>
        )}

        <Link
          href="/workspaces/new"
          className="workspace-selector-card workspace-selector-card-create"
        >
          <div className="workspace-selector-card-top">
            <span className="workspace-selector-mark">+</span>
            <span className="workspace-selector-open">创建新空间</span>
          </div>
          <div className="stack">
            <strong>新建工作空间</strong>
            <p className="muted">为新的案件、客户或专题建立独立资料库与会话历史。</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
