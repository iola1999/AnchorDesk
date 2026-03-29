"use client";

import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";

import { buttonStyles, cn, inputStyles, ui } from "@/lib/ui";

export function AccountPasswordForm({
  layout = "standalone",
}: {
  layout?: "standalone" | "compact";
}) {
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{
    tone: "error" | "muted";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        nextPassword,
        confirmPassword,
      }),
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setStatus({
        tone: "error",
        message: body?.error ?? "修改密码失败。",
      });
      return;
    }

    setStatus({
      tone: "muted",
      message: "密码已更新，正在退出所有登录会话...",
    });
    startTransition(() => {
      setNextPassword("");
      setConfirmPassword("");
    });
    await signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(layout === "standalone" ? cn(ui.panelLarge, "grid gap-5") : "grid gap-2.5")}
    >
      {layout === "standalone" ? (
        <div className="grid gap-2">
          <p className={ui.eyebrow}>Security</p>
          <h2>修改密码</h2>
        </div>
      ) : null}

      <div className={cn("grid gap-3", layout === "compact" && "xl:grid-cols-2")}>
        <label className={cn(ui.label, layout === "compact" && "gap-1 text-[13px] font-medium text-app-muted")}>
          新密码
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            className={layout === "compact" ? inputStyles({ size: "compact" }) : ui.input}
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
          />
        </label>

        <label className={cn(ui.label, layout === "compact" && "gap-1 text-[13px] font-medium text-app-muted")}>
          确认新密码
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            className={layout === "compact" ? inputStyles({ size: "compact" }) : ui.input}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          className={cn(
            buttonStyles({ size: layout === "compact" ? "xs" : "md" }),
          )}
          disabled={isPending}
          type="submit"
        >
          {isPending ? "提交中..." : "更新密码"}
        </button>
        {status ? (
          <span
            className={cn(
              status.tone === "error" ? ui.error : ui.muted,
              layout === "compact" && "text-[12px] leading-5",
            )}
          >
            {status.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
