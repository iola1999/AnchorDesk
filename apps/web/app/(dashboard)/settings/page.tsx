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
        <div className={cn(ui.panelLarge, "grid gap-2")}>
          <div className="space-y-1">
            <p className={ui.eyebrow}>System Settings</p>
            <h1>系统设置</h1>
          </div>
        </div>

        <aside className={cn(ui.panel, "grid content-start gap-3")}>
          <div className="space-y-1">
            <p className={ui.eyebrow}>Env Only</p>
            <h2>进程外配置</h2>
          </div>
          <div className={cn(ui.subcard, "grid gap-1.5")}>
            <code className={ui.codeChip}>DATABASE_URL</code>
          </div>
          <div className={cn(ui.subcard, "grid gap-1.5")}>
            <code className={ui.codeChip}>AUTH_SECRET</code>
          </div>
        </aside>
      </section>

      {sections.length > 0 ? (
        <SystemSettingsForm sections={sections} />
      ) : (
        <section className={cn(ui.panel, "grid gap-2")}>
          <h2>系统参数尚未初始化</h2>
          <p className={ui.muted}>先运行一次 `pnpm dev`。</p>
        </section>
      )}
    </div>
  );
}
