"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";

import {
  ChevronDownIcon,
  SlidersIcon,
} from "@/components/icons";
import {
  buildAccountSettingsHref,
  buildAccountSettingsReturnTo,
} from "@/lib/account-settings";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shared/popover";
import { WorkspaceUserMenuContent } from "@/components/workspaces/workspace-user-menu-content";
import {
  buildWorkspaceUserPanelState,
  type WorkspaceUserPanelAction,
} from "@/lib/workspace-user-panel";
import {
  buildSystemManagementSectionHref,
  resolveWorkspaceSystemManagementReturnTo,
} from "@/lib/system-management";
import { buttonStyles, cn, menuItemStyles, ui } from "@/lib/ui";

type WorkspacesHeaderActionsProps = {
  initialUser: {
    name?: string | null;
    username: string;
  };
  canAccessSystemSettings: boolean;
};

export function WorkspacesHeaderActions({
  initialUser,
  canAccessSystemSettings,
}: WorkspacesHeaderActionsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [openMenu, setOpenMenu] = useState<"account" | "admin" | null>(null);
  const accountMenuId = useId();
  const adminMenuId = useId();
  const accountHref = buildAccountSettingsHref({
    returnTo: buildAccountSettingsReturnTo(pathname, searchParams),
  });
  const systemManagementHref = buildSystemManagementSectionHref("models", {
    returnTo: resolveWorkspaceSystemManagementReturnTo(pathname),
  });

  const { accountActions, adminActions, avatarLabel, displayName, logoutAction, username } =
    buildWorkspaceUserPanelState({
      sessionUser: session?.user,
      initialUser,
      canAccessSystemSettings,
      accountHref,
      systemManagementHref,
    });

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  async function onSignOut() {
    setOpenMenu(null);
    setIsSigningOut(true);
    await signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {adminActions.length > 0 ? (
        <Popover
          open={openMenu === "admin"}
          onOpenChange={(nextOpen) => {
            setOpenMenu((current) => (nextOpen ? "admin" : current === "admin" ? null : current));
          }}
          placement="bottom-end"
          sideOffset={8}
          collisionPadding={12}
        >
          <PopoverContent id={adminMenuId} className="z-30 w-[240px]">
            <div className="px-3 pb-1 pt-2.5">
              <p className={ui.eyebrow}>管理</p>
              <h2 className="text-[14px] font-semibold text-app-text">管理入口</h2>
            </div>

            <div className="mx-2 my-1.5 h-px bg-app-border/70" />

            <nav className="grid gap-0.5 py-0.5">
              {adminActions.map((action) => (
                <Link
                  key={action.key}
                  href={action.href ?? "/"}
                  onClick={() => setOpenMenu(null)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-1.5 transition",
                    menuItemStyles(),
                  )}
                >
                  <span className="grid size-[26px] shrink-0 place-items-center rounded-lg text-app-muted-strong">
                    {resolveAdminActionIcon(action.key)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {action.label}
                  </span>
                </Link>
              ))}
            </nav>
          </PopoverContent>

          <PopoverTrigger asChild>
            <button
              type="button"
              aria-expanded={openMenu === "admin"}
              aria-controls={adminMenuId}
              aria-label={openMenu === "admin" ? "收起管理菜单" : "展开管理菜单"}
              className={headerMenuTriggerStyles(openMenu === "admin")}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-app-surface-strong text-app-accent">
                <SlidersIcon className="size-[13px]" />
              </span>
              <span className="text-[12px] font-medium text-app-text">管理</span>
              <ChevronDownIcon
                className={cn(
                  "size-3 text-app-muted transition",
                  openMenu === "admin" && "rotate-180 text-app-text",
                )}
              />
            </button>
          </PopoverTrigger>
        </Popover>
      ) : null}

      <Popover
        open={openMenu === "account"}
        onOpenChange={(nextOpen) => {
          setOpenMenu((current) => (nextOpen ? "account" : current === "account" ? null : current));
        }}
        placement="bottom-end"
        sideOffset={8}
        collisionPadding={12}
      >
        <PopoverContent
          id={accountMenuId}
          className="z-30 w-[min(264px,calc(100vw-24px))]"
        >
          <WorkspaceUserMenuContent
            displayName={displayName}
            username={username}
            avatarLabel={avatarLabel}
            actions={accountActions}
            logoutLabel={logoutAction?.label}
            isSigningOut={isSigningOut}
            onNavigate={() => setOpenMenu(null)}
            onSignOut={onSignOut}
          />
        </PopoverContent>

        <PopoverTrigger asChild>
          <button
            type="button"
            aria-expanded={openMenu === "account"}
            aria-controls={accountMenuId}
            aria-label={openMenu === "account" ? "收起账号菜单" : "展开账号菜单"}
            className={headerMenuTriggerStyles(openMenu === "account")}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-app-surface-strong text-[11px] font-semibold text-app-accent">
              {avatarLabel}
            </span>
            <span className="max-w-[8rem] truncate text-[12px] font-medium text-app-text">
              {displayName}
            </span>
            <ChevronDownIcon
              className={cn(
                "size-3 text-app-muted transition",
                openMenu === "account" && "rotate-180 text-app-text",
              )}
            />
          </button>
        </PopoverTrigger>
      </Popover>
    </div>
  );
}

function headerMenuTriggerStyles(open: boolean) {
  return cn(
    buttonStyles({ variant: "secondary", size: "sm", shape: "pill" }),
    "min-h-9 gap-1.5 border border-[color:color-mix(in_srgb,var(--outline-variant)_18%,transparent)] bg-app-surface-low/92 pl-2 pr-2.5 shadow-none hover:bg-app-surface",
    open && "bg-app-surface text-app-text",
  );
}

function resolveAdminActionIcon(key: WorkspaceUserPanelAction["key"]) {
  if (key === "system-management") {
    return <SlidersIcon />;
  }

  return <SlidersIcon />;
}
