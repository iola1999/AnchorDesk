"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { ConversationStreamEvent } from "@knowledge-assistant/contracts";

import { cn, ui } from "@/lib/ui";

type TimelineMessage = {
  id: string;
  status: "streaming" | "completed" | "failed";
  contentMarkdown: string;
  createdAt: string;
  structuredJson?: Record<string, unknown> | null;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function getTimelineTone(message: TimelineMessage) {
  const event = String(message.structuredJson?.timeline_event ?? "");

  if (message.status === "failed" || event === "tool_failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (message.status === "streaming" || event === "tool_started") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export function ConversationTimeline({
  conversationId,
  assistantMessageId,
  assistantStatus,
  initialMessages,
}: {
  conversationId: string;
  assistantMessageId: string | null;
  assistantStatus: "streaming" | "completed" | "failed" | null;
  initialMessages: TimelineMessage[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [timelineMessages, setTimelineMessages] = useState(initialMessages);
  const [runtimeStatus, setRuntimeStatus] = useState<string | null>(
    assistantStatus === "streaming" ? "助手正在分析问题并调用工具..." : null,
  );
  const seenMessageIdsRef = useRef(new Set(initialMessages.map((message) => message.id)));

  useEffect(() => {
    setTimelineMessages(initialMessages);
    seenMessageIdsRef.current = new Set(initialMessages.map((message) => message.id));
  }, [initialMessages]);

  useEffect(() => {
    if (!assistantMessageId || assistantStatus !== "streaming") {
      return;
    }

    const source = new EventSource(
      `/api/conversations/${conversationId}/stream?assistantMessageId=${assistantMessageId}`,
    );

    const handleToolMessage = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as ConversationStreamEvent;
      if (payload.type !== "tool_message") {
        return;
      }

      if (seenMessageIdsRef.current.has(payload.message_id)) {
        return;
      }

      seenMessageIdsRef.current.add(payload.message_id);
      setTimelineMessages((current) => [
        ...current,
        {
          id: payload.message_id,
          status: payload.status,
          contentMarkdown: payload.content_markdown,
          createdAt: payload.created_at,
          structuredJson: payload.structured ?? null,
        },
      ]);
    };

    const handleAnswerDone = () => {
      setRuntimeStatus("回答已生成，正在刷新对话...");
      source.close();
      startTransition(() => {
        router.refresh();
      });
    };

    const handleRunFailed = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as ConversationStreamEvent;
      setRuntimeStatus(
        payload.type === "run_failed" ? `运行失败：${payload.error}` : "运行失败。",
      );
      source.close();
      startTransition(() => {
        router.refresh();
      });
    };

    source.addEventListener("tool_message", handleToolMessage as EventListener);
    source.addEventListener("answer_done", handleAnswerDone as EventListener);
    source.addEventListener("run_failed", handleRunFailed as EventListener);
    source.onerror = () => {
      source.close();
      setRuntimeStatus("连接已断开，正在刷新对话...");
      startTransition(() => {
        router.refresh();
      });
    };

    return () => {
      source.close();
    };
  }, [assistantMessageId, assistantStatus, conversationId, router]);

  if (!timelineMessages.length && !runtimeStatus) {
    return null;
  }

  return (
    <section className={cn(ui.subpanel, "grid gap-4")}>
      <div className={ui.toolbar}>
        <div className="space-y-1">
          <h3>工具时间线</h3>
          <p className={ui.muted}>只展示工具调用与运行状态，不展示思维链。</p>
        </div>
        {runtimeStatus ? (
          <span className="inline-flex items-center rounded-full border border-app-border bg-white px-3 py-1 text-[12px] text-app-muted-strong">
            {runtimeStatus}
          </span>
        ) : null}
      </div>

      {timelineMessages.length > 0 ? (
        <div className="grid gap-3">
          {timelineMessages.map((message) => (
            <article
              key={message.id}
              className="grid gap-2 rounded-2xl border border-app-border bg-white/80 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-[12px]",
                    getTimelineTone(message),
                  )}
                >
                  {message.status === "streaming"
                    ? "进行中"
                    : message.status === "failed"
                      ? "失败"
                      : "完成"}
                </span>
                <span className="text-[12px] text-app-muted">{formatTime(message.createdAt)}</span>
              </div>
              <div className="text-sm leading-6 text-app-text">{message.contentMarkdown}</div>
            </article>
          ))}
        </div>
      ) : (
        <p className={ui.muted}>当前还没有工具事件。</p>
      )}
    </section>
  );
}

