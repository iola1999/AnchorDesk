"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonStyles, ui } from "@/lib/ui";
import { ConversationSharePopover } from "@/components/chat/conversation-share-popover";
import { ActionDialog } from "@/components/shared/action-dialog";

export function ConversationPageActions({
  conversationId,
  workspaceId,
}: {
  conversationId: string;
  workspaceId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isSubmitting || isPending;

  async function handleDelete() {
    setStatus(null);
    setIsSubmitting(true);

    try {
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

      setIsDeleteDialogOpen(false);

      startTransition(() => {
        router.push(`/workspaces/${workspaceId}`);
        router.refresh();
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ConversationSharePopover conversationId={conversationId} />
        <button
          className={buttonStyles({ variant: "secondary", size: "sm" })}
          disabled={isBusy}
          onClick={() => {
            setStatus(null);
            setIsDeleteDialogOpen(true);
          }}
          type="button"
        >
          删除
        </button>
        {status ? <span className={ui.error}>{status}</span> : null}
      </div>

      <ActionDialog
        open={isDeleteDialogOpen}
        tone="danger"
        role="alertdialog"
        title="删除当前会话"
        description="删除后会一并移除这段对话中的消息和引用记录。这个操作无法撤销。"
        error={status}
        confirmLabel="确认删除"
        pendingLabel="删除中..."
        onClose={() => {
          if (!isBusy) {
            setIsDeleteDialogOpen(false);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        isSubmitting={isBusy}
      />
    </>
  );
}
