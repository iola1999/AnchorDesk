import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";

import { conversations, documents, getDb, workspaces } from "@knowledge-assistant/db";

import { auth } from "@/auth";
import { isSuperAdminUsername } from "@/lib/auth/super-admin";
import { formatRelativeWorkspaceActivity } from "@/lib/api/workspace-overview";
import { buttonStyles, cn, ui } from "@/lib/ui";

function getWorkspaceBadgeLabel(title: string) {
  const normalized = title.trim();
  return Array.from(normalized)[0] ?? "空";
}

export default async function WorkspacesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const db = getDb();

  const workspaceList = userId
    ? await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.userId, userId))
        .orderBy(desc(workspaces.updatedAt), desc(workspaces.createdAt))
    : [];
  const workspaceIds = workspaceList.map((workspace) => workspace.id);
  const [conversationRows, documentRows] =
    workspaceIds.length > 0
      ? await Promise.all([
          db
            .select({
              workspaceId: conversations.workspaceId,
              updatedAt: conversations.updatedAt,
            })
            .from(conversations)
            .where(inArray(conversations.workspaceId, workspaceIds)),
          db
            .select({
              workspaceId: documents.workspaceId,
              updatedAt: documents.updatedAt,
            })
            .from(documents)
            .where(inArray(documents.workspaceId, workspaceIds)),
        ])
      : [[], []];
  const username = session?.user?.username ?? "";
  const canAccessSystemSettings = isSuperAdminUsername(username);
  const conversationCountByWorkspace = new Map<string, number>();
  const documentCountByWorkspace = new Map<string, number>();
  const latestActivityByWorkspace = new Map<string, Date>();

  for (const workspace of workspaceList) {
    latestActivityByWorkspace.set(workspace.id, workspace.updatedAt);
  }

  for (const conversation of conversationRows) {
    conversationCountByWorkspace.set(
      conversation.workspaceId,
      (conversationCountByWorkspace.get(conversation.workspaceId) ?? 0) + 1,
    );

    const latestActivity = latestActivityByWorkspace.get(conversation.workspaceId);
    if (!latestActivity || conversation.updatedAt > latestActivity) {
      latestActivityByWorkspace.set(conversation.workspaceId, conversation.updatedAt);
    }
  }

  for (const document of documentRows) {
    documentCountByWorkspace.set(
      document.workspaceId,
      (documentCountByWorkspace.get(document.workspaceId) ?? 0) + 1,
    );

    const latestActivity = latestActivityByWorkspace.get(document.workspaceId);
    if (!latestActivity || document.updatedAt > latestActivity) {
      latestActivityByWorkspace.set(document.workspaceId, document.updatedAt);
    }
  }

  return (
    <div className={ui.page}>
      <div className={ui.toolbar}>
        <p className={ui.eyebrow}>Spaces</p>

        <div className={ui.actions}>
          <Link href="/account" className={buttonStyles({ variant: "secondary" })}>
            账号与安全
          </Link>
          <Link href="/workspaces/new" className={buttonStyles()}>
            新建工作空间
          </Link>
          {canAccessSystemSettings ? (
            <Link href="/settings" className={buttonStyles({ variant: "secondary" })}>
              系统设置
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspaceList.length ? (
          workspaceList.map((workspace) => {
            const badgeLabel = getWorkspaceBadgeLabel(workspace.title);
            const conversationCount = conversationCountByWorkspace.get(workspace.id) ?? 0;
            const documentCount = documentCountByWorkspace.get(workspace.id) ?? 0;
            const latestActivity =
              latestActivityByWorkspace.get(workspace.id) ?? workspace.updatedAt;

            return (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.id}`}
                className={cn(
                  ui.panel,
                  "grid min-h-[220px] grid-rows-[auto_1fr_auto] gap-5 rounded-[24px] p-6 transition hover:-translate-y-0.5",
                )}
              >
                <div>
                  <span className="grid size-12 place-items-center rounded-2xl bg-app-surface-strong text-xl font-semibold text-app-accent">
                    {badgeLabel}
                  </span>
                </div>
                <div className="space-y-2">
                  <strong>{workspace.title}</strong>
                </div>
                <div className="grid gap-3 border-t border-app-border pt-4 text-sm text-app-muted">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>{conversationCount} 条会话</span>
                    <span>{documentCount} 份资料</span>
                  </div>
                  <div>最后活跃 {formatRelativeWorkspaceActivity(latestActivity)}</div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className={cn(ui.panel, "grid min-h-[220px] content-center rounded-[24px] p-6")}>
            <p>还没有工作空间，先创建一个空间再开始问答。</p>
          </div>
        )}

        <Link
          href="/workspaces/new"
          className={cn(
            ui.panel,
            "grid min-h-[220px] content-start gap-5 rounded-[24px] border-dashed p-6 transition hover:-translate-y-0.5",
          )}
        >
          <div>
            <span className="grid size-12 place-items-center rounded-2xl bg-app-surface-strong text-xl font-semibold text-app-accent">
              +
            </span>
          </div>
          <div className="space-y-2">
            <strong>新建工作空间</strong>
          </div>
        </Link>
      </div>
    </div>
  );
}
