"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AccountDisplayNameForm } from "@/components/account/account-display-name-form";
import { AccountPasswordForm } from "@/components/account/account-password-form";
import { AccountSettingsNav } from "@/components/account/account-settings-nav";
import { ArrowLeftIcon } from "@/components/icons";
import { LogoutButton } from "@/components/account/logout-button";
import { EditorialPageHeader } from "@/components/shared/editorial-page-header";
import {
  SettingsShell,
  SettingsShellSidebar,
} from "@/components/shared/settings-shell";
import {
  resolveAccountSettingsReturnHref,
  buildAccountSettingsNavGroups,
  resolveDefaultAccountSettingsSectionId,
  type AccountSettingsSectionId,
} from "@/lib/account-settings";
import { buttonStyles, cn, ui } from "@/lib/ui";
import { resolveWorkspaceUserAvatarLabel } from "@/lib/workspace-user-panel";

type AccountSettingsWorkbenchProps = {
  currentUser: {
    name?: string | null;
    username: string;
  };
};

export function AccountSettingsWorkbench({
  currentUser,
}: AccountSettingsWorkbenchProps) {
  const searchParams = useSearchParams();
  const navGroups = buildAccountSettingsNavGroups();
  const defaultSectionId = resolveDefaultAccountSettingsSectionId(navGroups);
  const [activeSectionId, setActiveSectionId] =
    useState<AccountSettingsSectionId>(defaultSectionId);
  const returnHref = resolveAccountSettingsReturnHref(searchParams.get("returnTo"));

  const displayName = currentUser.name ?? currentUser.username;

  useEffect(() => {
    function readSectionFromHash() {
      const hash = window.location.hash.replace("#", "");
      if (hash === "profile" || hash === "security") {
        setActiveSectionId(hash);
        return;
      }

      setActiveSectionId(defaultSectionId);
    }

    readSectionFromHash();
    window.addEventListener("hashchange", readSectionFromHash);

    return () => {
      window.removeEventListener("hashchange", readSectionFromHash);
    };
  }, [defaultSectionId]);

  function onSelectSection(nextSectionId: AccountSettingsSectionId) {
    setActiveSectionId(nextSectionId);
    window.history.replaceState(null, "", `#${nextSectionId}`);
  }

  return (
    <SettingsShell
      sidebar={
        <SettingsShellSidebar>
          <Link
            href={returnHref}
            className={cn(
              buttonStyles({ variant: "ghost", size: "sm" }),
              "self-start gap-1.5",
            )}
          >
            <ArrowLeftIcon />
            返回工作台
          </Link>

          <div className="grid gap-4">
            <div className="flex items-center gap-3 px-1">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-app-surface-strong text-[13px] font-semibold text-app-accent">
                {resolveWorkspaceUserAvatarLabel(displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[13px] font-semibold text-app-text">
                  {displayName}
                </strong>
                <span className="block truncate text-[11px] text-app-muted">
                  @{currentUser.username}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-app-surface-lowest/60 p-1 shadow-soft backdrop-blur-sm">
              <AccountSettingsNav
                groups={navGroups}
                activeSectionId={activeSectionId}
                onSelect={onSelectSection}
              />
            </div>
          </div>
        </SettingsShellSidebar>
      }
    >
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
        <EditorialPageHeader eyebrow="账号" title="个人设置" />

        {activeSectionId === "profile" ? (
          <AccountSettingsSection title="个人资料">
            <AccountSettingsRow title="显示名称">
              <AccountDisplayNameForm initialDisplayName={displayName} layout="compact" />
            </AccountSettingsRow>
          </AccountSettingsSection>
        ) : null}

        {activeSectionId === "security" ? (
          <AccountSettingsSection title="安全与登录">
            <AccountSettingsRow title="更新密码">
              <AccountPasswordForm layout="compact" />
            </AccountSettingsRow>

            <AccountSettingsRow title="退出登录">
              <LogoutButton layout="compact" />
            </AccountSettingsRow>
          </AccountSettingsSection>
        ) : null}
      </div>
    </SettingsShell>
  );
}

function AccountSettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(ui.panelLarge, "grid gap-4")}>
      <h3 className="text-[1.08rem] font-semibold text-app-text">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function AccountSettingsRow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(ui.subcard, "grid gap-3 md:grid-cols-[172px_minmax(0,1fr)] md:gap-4")}>
      <div className="grid content-start gap-1">
        <h3 className="text-[14px] font-semibold text-app-text">{title}</h3>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
