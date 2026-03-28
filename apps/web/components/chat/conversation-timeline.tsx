"use client";

import { MESSAGE_STATUS, TIMELINE_EVENT, type MessageStatus } from "@knowledge-assistant/contracts";

import { cn, ui } from "@/lib/ui";

type TimelineMessage = {
  id: string;
  status: MessageStatus;
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

  if (message.status === MESSAGE_STATUS.FAILED || event === TIMELINE_EVENT.TOOL_FAILED) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    message.status === MESSAGE_STATUS.STREAMING ||
    event === TIMELINE_EVENT.TOOL_STARTED
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export function ConversationTimeline({
  timelineMessages,
  runtimeStatus,
}: {
  timelineMessages: TimelineMessage[];
  runtimeStatus?: string | null;
}) {
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
                  {message.status === MESSAGE_STATUS.STREAMING
                    ? "进行中"
                    : message.status === MESSAGE_STATUS.FAILED
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
