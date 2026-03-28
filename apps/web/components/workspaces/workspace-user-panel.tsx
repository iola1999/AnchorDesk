"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { buttonStyles, cn, ui } from "@/lib/ui";

type WorkspaceUserPanelProps = {
  initialUser: {
    name?: string | null;
    username: string;
  };
  canAccessSystemSettings: boolean;
};

export function WorkspaceUserPanel({
  initialUser,
  canAccessSystemSettings,
}: WorkspaceUserPanelProps) {
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const username = session?.user?.username || initialUser.username;
  const displayName = session?.user?.name || initialUser.name || username;
  const avatarLabel = displayName.slice(0, 1).toUpperCase();

  async function onSignOut() {
    setIsSigningOut(true);
    await signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <div className="mt-auto grid gap-3 rounded-[18px] border border-app-border bg-white/60 p-3 shadow-soft">
      <div className="inline-flex size-10 items-center justify-center rounded-xl bg-app-surface-strong font-semibold text-app-accent">
        {avatarLabel}
      </div>
      <div className="grid gap-1">
        <strong className="text-sm">{displayName}</strong>
        <span className={ui.muted}>@{username}</span>
      </div>
      <div className="grid gap-2">
        <Link href="/account" className={cn(buttonStyles({ variant: "secondary", block: true }), "justify-start rounded-xl")}>
          账号设置
        </Link>
        {canAccessSystemSettings ? (
          <Link
            href="/settings"
            className={cn(buttonStyles({ variant: "secondary", block: true }), "justify-start rounded-xl")}
          >
            系统设置
          </Link>
        ) : null}
        <button
          type="button"
          className={cn(buttonStyles({ variant: "ghost", block: true }), "justify-start rounded-xl")}
          disabled={isSigningOut}
          onClick={onSignOut}
        >
          {isSigningOut ? "退出中..." : "退出登录"}
        </button>
      </div>
    </div>
  );
}
