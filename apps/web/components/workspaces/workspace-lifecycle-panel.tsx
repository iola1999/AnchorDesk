"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonStyles, cn, ui } from "@/lib/ui";

export function WorkspaceLifecyclePanel({
  workspaceId,
  workspaceTitle,
  archived,
}: {
  workspaceId: string;
  workspaceTitle: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<{
    tone: "error" | "muted";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function updateArchiveState(nextArchived: boolean) {
    setStatus(null);

    const response = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        archived: nextArchived,
      }),
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setStatus({
        tone: "error",
        message: body?.error ?? "更新工作空间状态失败。",
      });
      return;
    }

    setStatus({
      tone: "muted",
      message: nextArchived ? "工作空间已归档。" : "工作空间已恢复。",
    });

    startTransition(() => {
      if (nextArchived) {
        router.push("/workspaces");
      } else {
        router.refresh();
      }
    });
  }

  async function deleteWorkspace() {
    const confirmed = window.confirm(
      `确认删除工作空间「${workspaceTitle}」？其资料、会话和报告会一起删除。`,
    );
    if (!confirmed) {
      return;
    }

    setStatus(null);

    const response = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "DELETE",
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setStatus({
        tone: "error",
        message: body?.error ?? "删除工作空间失败。",
      });
      return;
    }

    startTransition(() => {
      router.push("/workspaces");
      router.refresh();
    });
  }

  return (
    <section className={cn(ui.panelLarge, "grid gap-5 p-6")}>
      <div className="grid gap-2">
        <p className={ui.eyebrow}>Lifecycle</p>
        <h2>归档与删除</h2>
        <p className={ui.muted}>
          归档会把当前空间从默认列表中隐藏；删除会一并移除该空间下的资料、会话和报告。
        </p>
      </div>

      <div className={cn(ui.subcard, "grid gap-2")}>
        <strong className="text-sm">{archived ? "当前已归档" : "当前为活跃空间"}</strong>
        <p className={ui.muted}>
          {archived
            ? "恢复后会重新出现在空间列表中。"
            : "归档后不会再出现在默认空间列表中，但数据会保留。"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={buttonStyles({ variant: "secondary" })}
          disabled={isPending}
          onClick={() => void updateArchiveState(!archived)}
        >
          {isPending ? "处理中..." : archived ? "恢复工作空间" : "归档工作空间"}
        </button>
        <button
          type="button"
          className={buttonStyles({ variant: "danger" })}
          disabled={isPending}
          onClick={() => void deleteWorkspace()}
        >
          {isPending ? "处理中..." : "删除工作空间"}
        </button>
      </div>

      {status ? (
        <p className={status.tone === "error" ? ui.error : ui.muted}>{status.message}</p>
      ) : null}
    </section>
  );
}
