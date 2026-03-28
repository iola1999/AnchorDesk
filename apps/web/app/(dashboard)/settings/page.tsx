import { asc } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getDb, systemSettings } from "@knowledge-assistant/db";

import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import { buildSystemSettingSections } from "@/lib/api/system-settings";
import { requireSessionUser } from "@/lib/auth/require-user";
import { isSuperAdminUsername } from "@/lib/auth/super-admin";
import { cn, ui } from "@/lib/ui";

export default async function SettingsPage() {
  const user = await requireSessionUser();
  if (!isSuperAdminUsername(user.username)) {
    notFound();
  }

  const db = getDb();
  const rows = await db
    .select({
      settingKey: systemSettings.settingKey,
      valueText: systemSettings.valueText,
      isSecret: systemSettings.isSecret,
      description: systemSettings.description,
    })
    .from(systemSettings)
    .orderBy(asc(systemSettings.settingKey));

  const sections = buildSystemSettingSections(rows);

  return (
    <div className={ui.page}>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_320px]">
        <div className={cn(ui.panelLarge, "grid gap-4")}>
          <div className="space-y-2">
            <p className={ui.eyebrow}>System Settings</p>
            <h1>系统设置</h1>
            <p className={ui.muted}>
              当前页面用于维护大部分 provider / infra 参数。保存后需要重启开发进程，避免
              `worker`、`agent-runtime`、`parser` 和 `web` 使用到不一致的启动配置。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className={cn(ui.subcard, "grid gap-2")}>
              <strong className="text-sm">数据库内可运营参数</strong>
              <p className={ui.muted}>
                模型、对象存储、Qdrant、服务地址等运行参数都优先在这里维护。
              </p>
            </div>
            <div className={cn(ui.subcard, "grid gap-2")}>
              <strong className="text-sm">保存后需要重启</strong>
              <p className={ui.muted}>
                当前是启动时加载配置，不会热更新到已运行进程。
              </p>
            </div>
          </div>
        </div>

        <aside className={cn(ui.panel, "grid content-start gap-3")}>
          <div className="space-y-2">
            <p className={ui.eyebrow}>Env Only</p>
            <h2>进程外配置</h2>
          </div>
          <div className={cn(ui.subcard, "grid gap-2")}>
            <code className={ui.codeChip}>DATABASE_URL</code>
            <p className={ui.muted}>数据库入口，只能从环境变量提供。</p>
          </div>
          <div className={cn(ui.subcard, "grid gap-2")}>
            <code className={ui.codeChip}>AUTH_SECRET</code>
            <p className={ui.muted}>Auth.js 根密钥，不写回业务数据库。</p>
          </div>
          <p className={ui.muted}>
            当前页面只有 `SUPER_ADMIN_USERNAMES` 中声明的注册用户名可访问。
          </p>
        </aside>
      </section>

      {sections.length > 0 ? (
        <SystemSettingsForm sections={sections} />
      ) : (
        <section className={cn(ui.panel, "grid gap-3")}>
          <h2>系统参数尚未初始化</h2>
          <p className={ui.muted}>
            先运行一次 `pnpm dev`，让建表和默认系统参数补齐流程跑完，再回来编辑这里。
          </p>
        </section>
      )}
    </div>
  );
}
