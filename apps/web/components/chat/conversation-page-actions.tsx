"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonStyles, ui } from "@/lib/ui";
import { ConversationSharePopover } from "@/components/chat/conversation-share-popover";

export function ConversationPageActions({
  conversationId,
  workspaceId,
  canRetry,
}: {
  conversationId: string;
  workspaceId: string;
  canRetry: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleRetry() {
    setStatus(null);

    const response = await fetch(`/api/conversations/${conversationId}/retry`, {
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setStatus(body?.error ?? "重新生成失败。");
      return;
    }

    setStatus("正在重新生成回答...");
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleDelete() {
    const confirmed = window.confirm("删除后会话消息将一并移除，是否继续？");
    if (!confirmed) {
      return;
    }

    setStatus(null);

    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setStatus(body?.error ?? "删除会话失败。");
      return;
    }

    startTransition(() => {
      router.push(`/workspaces/${workspaceId}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ConversationSharePopover conversationId={conversationId} />
      {canRetry ? (
        <button
          className={buttonStyles({ variant: "secondary", size: "sm" })}
          disabled={isPending}
          onClick={handleRetry}
          type="button"
        >
          重新生成
        </button>
      ) : null}
      <button
        className={buttonStyles({ variant: "secondary", size: "sm" })}
        disabled={isPending}
        onClick={handleDelete}
        type="button"
      >
        删除
      </button>
      {status ? <span className={ui.muted}>{status}</span> : null}
    </div>
  );
}
