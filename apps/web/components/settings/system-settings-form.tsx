"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";

import {
  SettingsShell,
  SettingsShellSidebar,
} from "@/components/shared/settings-shell";
import {
  filterSystemSettingSections,
  type SystemSettingRow,
  type SystemSettingSection,
} from "@/lib/api/system-settings";
import { buttonStyles, cn, inputStyles, ui } from "@/lib/ui";

function flattenSettings(rows: SystemSettingRow[]) {
  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.settingKey] = row.valueText ?? "";
    return acc;
  }, {});
}

function flattenSections(sections: SystemSettingSection[]) {
  return flattenSettings(sections.flatMap((section) => section.items));
}

function countSettings(sections: SystemSettingSection[]) {
  return sections.reduce((sum, section) => sum + section.items.length, 0);
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function SystemSettingsForm({
  sections,
}: {
  sections: SystemSettingSection[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    flattenSections(sections),
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<{
    tone: "error" | "muted";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setValues(flattenSections(sections));
  }, [sections]);

  const visibleSections = filterSystemSettingSections(sections, deferredQuery);
  const totalSettingCount = countSettings(sections);
  const visibleSettingCount = countSettings(visibleSections);
  const hasSearchQuery = Boolean(normalizeSearchText(deferredQuery));
  const hasSettings = sections.length > 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    try {
      const response = await fetch("/api/system-settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          settings: Object.entries(values).map(([settingKey, valueText]) => ({
            settingKey,
            valueText,
          })),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; settings?: SystemSettingRow[] }
        | null;

      if (!response.ok) {
        setStatus({
          tone: "error",
          message: body?.error ?? "保存系统设置失败",
        });
        return;
      }

      if (body?.settings) {
        setValues(flattenSettings(body.settings));
      }

      setStatus({
        tone: "muted",
        message: "已保存，重启相关进程后生效",
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : "保存系统设置失败",
      });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <SettingsShell
        sidebar={
          <SettingsShellSidebar>
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-1.5 self-start rounded-full px-1.5 py-1 text-[13px] text-app-muted-strong transition hover:bg-white/82 hover:text-app-text"
            >
              <BackIcon />
              返回工作台
            </Link>

            <section className="grid gap-3 rounded-[26px] border border-app-border bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(252,249,243,0.88))] p-3.5 shadow-soft">
              <div className="grid gap-0.5">
                <p className={ui.eyebrow}>System Settings</p>
                <h1 className="text-[1.55rem] font-semibold text-app-text">系统设置</h1>
              </div>
            </section>

            {hasSettings ? (
              <section className="rounded-[24px] border border-app-border bg-app-sidebar/62 p-2.5 shadow-soft">
                <div className="grid gap-2">
                  <div className="px-2">
                    <p className={ui.eyebrow}>Sections</p>
                    <h2 className="text-[1.02rem] font-semibold text-app-text">配置分组</h2>
                  </div>
                  <nav className="grid gap-1" aria-label="系统设置分组导航">
                    {visibleSections.map((section) => {
                      const totalItems = sections.find(
                        (candidate) => candidate.id === section.id,
                      )?.items.length;

                      return (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className="flex items-center justify-between gap-3 rounded-[16px] px-2.5 py-2 text-left text-sm text-app-muted-strong transition hover:bg-white hover:text-app-text"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-app-text">{section.title}</span>
                          </span>
                          <span className="shrink-0 text-xs text-app-muted">
                            {section.items.length}
                            {typeof totalItems === "number" && totalItems !== section.items.length
                              ? `/${totalItems}`
                              : ""}
                          </span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </section>
            ) : null}

            <section className={cn(ui.panel, "grid gap-3 p-4")}>
              <button className={buttonStyles({ block: true })} disabled={isPending} type="submit">
                {isPending ? "刷新中..." : "保存系统设置"}
              </button>
              {status ? (
                <p className={status.tone === "error" ? ui.error : ui.muted}>
                  {status.message}
                </p>
              ) : null}
            </section>
          </SettingsShellSidebar>
        }
      >
        <div className="mx-auto flex w-full max-w-[980px] flex-col gap-4">
          <div className="sticky top-4 z-20 -mx-1 rounded-[24px] border border-app-border/70 bg-white/88 px-4 py-3 shadow-soft backdrop-blur-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <header className="grid gap-1">
                <p className={ui.eyebrow}>Runtime Config</p>
                <h2 className="text-[1.78rem] font-semibold text-app-text md:text-[2rem]">
                  运行时配置
                </h2>
              </header>

              <label className="grid gap-2 md:w-[320px]">
                <span className="sr-only">搜索系统设置</span>
                <input
                  autoComplete="off"
                  className={inputStyles({ size: "compact" })}
                  placeholder="搜 key、说明、provider"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
          </div>

          {!hasSettings ? (
            <section className={cn(ui.panel, "grid gap-2")}>
              <h2 className="text-[1.24rem] font-semibold text-app-text">系统参数尚未初始化</h2>
              <p className={ui.muted}>先运行一次 `pnpm dev`，再回来维护数据库配置。</p>
            </section>
          ) : visibleSections.length === 0 ? (
            <section className={cn(ui.panel, "grid gap-2")}>
              <h2 className="text-[1.24rem] font-semibold text-app-text">没有匹配的系统参数</h2>
              <p className={ui.muted}>换个参数名、说明词或 provider 名再试。</p>
            </section>
          ) : (
            visibleSections.map((section) => (
              <section
                id={section.id}
                key={section.id}
                className="rounded-[26px] border border-app-border bg-white/88 p-5 shadow-soft scroll-mt-8 md:p-6"
              >
                <div className="grid gap-1">
                  <p className={ui.eyebrow}>{section.id}</p>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <h2 className="text-[1.28rem] font-semibold text-app-text">{section.title}</h2>
                      <p className={ui.mutedStrong}>{section.description}</p>
                    </div>
                    <span className="rounded-full border border-app-border bg-app-surface-soft px-3 py-1 text-[13px] text-app-muted-strong">
                      {section.items.length} 项
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  {section.items.map((setting) => (
                    <div
                      key={setting.settingKey}
                      className="grid gap-3 border-t border-app-border pt-4 md:grid-cols-[260px_minmax(0,1fr)] md:gap-4"
                    >
                      <div className="grid content-start gap-1.5">
                        <code className={ui.codeChip}>{setting.settingKey}</code>
                        {setting.summary || setting.description ? (
                          <p className="text-sm leading-6 text-app-muted-strong">
                            {setting.summary ?? setting.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <SystemSettingInput
                          setting={setting}
                          value={values[setting.settingKey] ?? ""}
                          onChange={(value) =>
                            setValues((current) => ({
                              ...current,
                              [setting.settingKey]: value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </SettingsShell>
    </form>
  );
}

function SystemSettingInput({
  setting,
  value,
  onChange,
}: {
  setting: SystemSettingSection["items"][number];
  value: string;
  onChange: (value: string) => void;
}) {
  if (setting.inputKind === "textarea") {
    return (
      <textarea
        className={ui.textarea}
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (setting.inputKind === "boolean") {
    return (
      <select className={ui.select} value={value || "false"} onChange={(event) => onChange(event.target.value)}>
        <option value="true">开启</option>
        <option value="false">关闭</option>
      </select>
    );
  }

  return (
    <input
      autoComplete="off"
      className={ui.input}
      type={setting.inputKind}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M12.5 4.75 7.25 10l5.25 5.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
