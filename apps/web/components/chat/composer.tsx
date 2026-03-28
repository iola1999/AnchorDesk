"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonStyles, cn, ui } from "@/lib/ui";

type ComposerProps = {
  conversationId?: string;
  workspaceId?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  variant?: "card" | "stage";
  rows?: number;
  helperText?: string;
  className?: string;
  textareaClassName?: string;
};

export function Composer({
  conversationId,
  workspaceId,
  title = "提问",
  description,
  placeholder = "输入你的问题...",
  submitLabel = "发送",
  variant = "card",
  rows,
  helperText,
  className,
  textareaClassName,
}: ComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = content.trim();
    if (!prompt) return;

    let targetConversationId = conversationId;
    if (!targetConversationId) {
      if (!workspaceId) {
        setStatus("缺少工作空间信息，无法创建对话。");
        return;
      }

      setStatus("正在创建对话...");
      const createResponse = await fetch(`/api/workspaces/${workspaceId}/conversations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const createBody = (await createResponse.json().catch(() => null)) as
        | { error?: string; conversation?: { id: string } }
        | null;

      targetConversationId = createBody?.conversation?.id;
      if (!createResponse.ok || !targetConversationId) {
        setStatus(createBody?.error ?? "创建对话失败。");
        return;
      }
    }

    setStatus("正在发送...");
    const response = await fetch(`/api/conversations/${targetConversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: prompt }),
    });

    if (response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { agentError?: string }
        | null;
      setContent("");
      setStatus(
        body?.agentError
          ? `消息已保存，但 Agent 处理失败：${body.agentError}`
          : "消息已提交，正在建立工具时间线...",
      );
      startTransition(() => {
        if (!conversationId && workspaceId) {
          router.push(`/workspaces/${workspaceId}?conversationId=${targetConversationId}`);
        }
        router.refresh();
      });
    } else {
      setStatus("发送失败。");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "grid gap-4",
        variant === "stage"
          ? "rounded-[28px] border border-app-border/70 bg-white/82 p-5 shadow-soft backdrop-blur-sm"
          : `${ui.panel} gap-3`,
        className,
      )}
    >
      <div className="grid gap-2">
        <h3>{title}</h3>
        {description ? <p className={ui.muted}>{description}</p> : null}
      </div>
      <textarea
        required
        rows={rows ?? (variant === "stage" ? 6 : 4)}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className={cn(
          ui.textarea,
          variant === "stage"
            ? "min-h-[176px] rounded-[24px] border-app-border/70 bg-app-surface-soft/65 px-5 py-4 text-[15px] leading-7"
            : "min-h-[120px]",
          textareaClassName,
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={cn(ui.muted, "max-w-[44ch] text-[13px]")}>{helperText ??
          (variant === "stage"
            ? "首条消息会自动创建会话，助手会优先使用当前空间里的资料和上下文"
            : "消息会写入当前会话，并开始推送工具时间线")}</div>
        <button className={buttonStyles()} disabled={isPending} type="submit">
          {isPending ? "刷新中..." : submitLabel}
        </button>
      </div>
      {status ? <p className={cn(ui.muted, "text-[13px]")}>{status}</p> : null}
    </form>
  );
}
