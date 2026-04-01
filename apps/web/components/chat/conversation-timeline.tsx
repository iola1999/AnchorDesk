"use client";

import { useEffect, useState } from "react";

import { MESSAGE_STATUS, type MessageStatus } from "@anchordesk/contracts";

import {
  AnswerIcon,
  ChevronDownIcon,
  GlobeIcon,
  LibraryIcon,
  SlidersIcon,
  SourceIcon,
} from "@/components/icons";
import {
  buildAssistantProcessTimelineEntries,
  canShowAssistantProcess,
  describeAssistantProcessSummary,
} from "@/lib/api/conversation-process";
import { conversationDensityClassNames } from "@/lib/conversation-density";
import {
  buildConversationTimelineEntryView,
  canExpandConversationTimelineEntry,
  type ConversationTimelinePreviewItem,
  type ConversationTimelineEntryView,
} from "@/lib/conversation-timeline";
import { cn } from "@/lib/ui";

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
  }).format(new Date(value));
}

function formatTimeRange(startAt: string, completedAt: string | null) {
  if (!completedAt || completedAt === startAt) {
    return formatTime(startAt);
  }

  const startLabel = formatTime(startAt);
  const completedLabel = formatTime(completedAt);
  return startLabel === completedLabel ? completedLabel : `${startLabel} → ${completedLabel}`;
}

function formatPayloadValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function describePayloadPreview(value: unknown) {
  if (value == null) {
    return "空";
  }

  if (Array.isArray(value)) {
    return `${value.length} 项`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return keys.length <= 2 ? keys.join("、") || "对象" : `${keys.slice(0, 2).join("、")} 等 ${keys.length} 项`;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return "字符串";
    }

    return normalized.length > 28 ? `${normalized.slice(0, 28)}...` : normalized;
  }

  return String(value);
}

function resolveTimelineIcon(entry: ConversationTimelineEntryView) {
  switch (entry.icon) {
    case "knowledge":
    case "attachment":
      return <LibraryIcon className="size-3.5" />;
    case "web":
      return <GlobeIcon className="size-3.5" />;
    case "fetch":
      return <SourceIcon className="size-3.5" />;
    case "thinking":
    case "report":
      return <AnswerIcon className="size-3.5" />;
    default:
      return <SlidersIcon className="size-3.5" />;
  }
}

function resolveMarkerClasses(entry: ConversationTimelineEntryView) {
  return entry.tone === "danger"
    ? "border-red-200/90 bg-red-50 text-red-700"
    : entry.tone === "active"
      ? "border-app-border-strong bg-white text-app-text"
      : "border-app-border/70 bg-app-bg text-app-muted-strong";
}

function resolveStatusClasses(entry: ConversationTimelineEntryView) {
  return entry.tone === "danger"
    ? "border-red-200/80 bg-red-50/88 text-red-700"
    : entry.tone === "active"
      ? "border-app-border/80 bg-app-surface-soft/82 text-app-text"
      : "border-app-border/70 bg-white/78 text-app-muted-strong";
}

function resolvePreviewToneClasses(tone: ConversationTimelinePreviewItem["tone"]) {
  return tone === "danger"
    ? {
        pill: "border-red-200/80 bg-red-50 text-red-700",
        value: "text-red-700",
        meta: "text-red-600/85",
      }
    : tone === "warning"
      ? {
          pill: "border-amber-200/80 bg-amber-50 text-amber-800",
          value: "text-amber-900",
          meta: "text-amber-700/85",
        }
      : {
          pill: "border-app-border/70 bg-app-surface-soft/76 text-app-muted-strong",
          value: "text-app-text",
          meta: "text-app-muted",
        };
}

function ToolPayloadBlock({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-w-0">
      <button
        type="button"
        className={cn(
          conversationDensityClassNames.payloadDisclosure,
          open && "bg-app-surface-soft/84 text-app-text",
        )}
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span className="font-medium">{label}</span>
        <span className="min-w-0 max-w-[180px] truncate text-app-muted min-[720px]:max-w-[260px]">
          {describePayloadPreview(value)}
        </span>
        <ChevronDownIcon
          className={cn("size-3 shrink-0 text-app-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <pre className={cn("mt-1.5", conversationDensityClassNames.payloadPre)}>
          {formatPayloadValue(value)}
        </pre>
      ) : null}
    </div>
  );
}

function TimelinePreviewList({
  items,
  limit,
}: {
  items: ConversationTimelinePreviewItem[];
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems =
    showAll || typeof limit !== "number" ? items : items.slice(0, limit);
  const hiddenCount =
    typeof limit === "number" && !showAll ? Math.max(items.length - limit, 0) : 0;
  const canToggle = typeof limit === "number" && items.length > limit;

  if (visibleItems.length === 0 && hiddenCount === 0) {
    return null;
  }

  return (
    <div className={conversationDensityClassNames.timelinePreviewList}>
      {visibleItems.map((item, index) => {
        const toneClasses = resolvePreviewToneClasses(item.tone);
        const content = (
          <span
            className={cn(
              conversationDensityClassNames.timelinePreviewItem,
              item.href ? "group hover:bg-white/74" : "",
            )}
          >
            <span
              className={cn(
                "inline-flex h-5 shrink-0 items-center rounded-full border px-1.5 text-[9.5px] font-semibold",
                toneClasses.pill,
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-[11px] leading-4.5",
                toneClasses.value,
                item.href ? "group-hover:underline" : "",
              )}
            >
              {item.value}
            </span>
            {item.meta ? (
              <span
                className={cn(
                  "hidden max-w-[42%] shrink-0 truncate text-[10px] leading-4 min-[520px]:inline",
                  toneClasses.meta,
                )}
              >
                {item.meta}
              </span>
            ) : null}
          </span>
        );

        return item.href ? (
          <a
            key={`${item.label}-${index}`}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        ) : (
          <div key={`${item.label}-${index}`}>{content}</div>
        );
      })}

      {canToggle ? (
        <button
          type="button"
          className="w-fit rounded-full px-1 py-0.5 text-[10.5px] font-medium text-app-muted transition hover:text-app-text"
          onClick={() => {
            setShowAll((current) => !current);
          }}
        >
          {showAll ? "收起" : `+ 其他 ${hiddenCount} 项`}
        </button>
      ) : null}
    </div>
  );
}

function TimelineEntry({
  entry,
  defaultOpen = false,
}: {
  entry: ConversationTimelineEntryView;
  defaultOpen?: boolean;
}) {
  const expandable = canExpandConversationTimelineEntry(entry);
  const visibleArguments = entry.arguments.slice(0, 2);
  const hiddenArgumentCount = Math.max(entry.arguments.length - visibleArguments.length, 0);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen, entry.id]);

  const summary = (
    <span className="grid min-w-0 grid-cols-[16px_minmax(0,1fr)_auto] items-start gap-2">
      <span className="relative z-10 flex justify-center pt-[3px]">
        <span
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full border",
            resolveMarkerClasses(entry),
          )}
        >
          {resolveTimelineIcon(entry)}
        </span>
      </span>

      <span className="min-w-0">
        <span className="flex min-w-0 items-start gap-2">
          <span className="min-w-0 flex-1 truncate text-[12px] leading-4.5 text-app-text">
            {entry.displayName}
          </span>
        </span>

        {visibleArguments.length > 0 || hiddenArgumentCount > 0 ? (
          <span className="mt-0.5 flex flex-wrap gap-1">
            {visibleArguments.map((item) => (
              <span
                key={`${item.label}-${item.value}`}
                className={conversationDensityClassNames.timelineArgument}
              >
                <span className="shrink-0 text-app-muted">{item.label}</span>
                <span className="min-w-0 truncate text-app-text">{item.value}</span>
              </span>
            ))}
            {hiddenArgumentCount > 0 ? (
              <span className="inline-flex items-center rounded-full border border-app-border/65 bg-white/74 px-1.5 py-0.5 text-[10px] text-app-muted">
                +{hiddenArgumentCount}
              </span>
            ) : null}
          </span>
        ) : null}

        {entry.previewSummary && !open ? (
          <span className="mt-0.5 block truncate text-[10.5px] leading-4 text-app-muted">
            {entry.previewSummary}
          </span>
        ) : null}
      </span>

      <span className="flex items-start gap-1 pt-[1px]">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold",
            resolveStatusClasses(entry),
          )}
        >
          {entry.statusLabel}
        </span>
        {expandable ? (
          <span
            className={cn(
              "text-app-muted transition-transform",
              open ? "rotate-180" : "rotate-0",
            )}
          >
            <ChevronDownIcon className="size-3.5" />
          </span>
        ) : null}
      </span>
    </span>
  );

  const details = (
    <div className="ml-[22px] mt-1 grid min-w-0 max-w-full gap-1.5 overflow-hidden">
      {entry.kind === "thinking" && entry.detailText ? (
        <div className="min-w-0 max-w-full overflow-hidden rounded-[12px] bg-app-surface-soft/52 px-2.5 py-2">
          <pre className="whitespace-pre-wrap break-words text-[11.5px] leading-5 text-app-muted-strong">
            {entry.detailText}
          </pre>
        </div>
      ) : null}

      {entry.previewSummary && entry.kind !== "thinking" && entry.previewItems.length === 0 ? (
        <p className="text-[10.5px] leading-4.5 text-app-muted-strong">{entry.previewSummary}</p>
      ) : null}

      {entry.previewItems.length > 0 ? (
        <TimelinePreviewList items={entry.previewItems} limit={3} />
      ) : null}

      {entry.input !== null || entry.output !== null ? (
        <div className="grid gap-1">
          {entry.input !== null ? <ToolPayloadBlock label="查看原始入参" value={entry.input} /> : null}
          {entry.output !== null ? <ToolPayloadBlock label="查看原始结果" value={entry.output} /> : null}
        </div>
      ) : null}

      <p className="pl-0.5 text-[10px] leading-4 text-app-muted">
        {formatTimeRange(entry.createdAt, entry.completedAt)}
      </p>
    </div>
  );

  if (!expandable) {
    return (
      <article className={conversationDensityClassNames.timelineEntry}>
        {summary}
      </article>
    );
  }

  return (
    <article className={conversationDensityClassNames.timelineEntry}>
      <button
        type="button"
        className="w-full cursor-pointer rounded-[12px] px-0.5 py-0.5 text-left transition hover:bg-white/48"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        {summary}
      </button>
      {open ? details : null}
    </article>
  );
}

export function ConversationTimeline({
  assistantContentMarkdown,
  assistantStatus,
  assistantStructuredJson,
  timelineMessages,
  runtimeStatus,
  defaultOpen = false,
}: {
  assistantContentMarkdown: string;
  assistantStatus: MessageStatus;
  assistantStructuredJson?: Record<string, unknown> | null;
  timelineMessages: TimelineMessage[];
  runtimeStatus?: string | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const timelineEntries = buildAssistantProcessTimelineEntries({
    assistantContentMarkdown,
    assistantStatus,
    assistantStructuredJson,
    timelineMessages,
  }).map(buildConversationTimelineEntryView);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const summary = describeAssistantProcessSummary({
    stepCount: timelineEntries.length,
    isStreaming: defaultOpen,
    runtimeStatus,
  });

  if (
    !canShowAssistantProcess({
      stepCount: timelineEntries.length,
      isStreaming: defaultOpen,
    }) ||
    !summary
  ) {
    return null;
  }

  return (
    <div className={conversationDensityClassNames.timelineShell}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-1 text-[11.5px] font-semibold text-app-muted-strong transition hover:text-app-text"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <ChevronDownIcon
          className={cn("size-3.5 transition-transform", open ? "rotate-180" : "rotate-0")}
        />
        <span className="text-app-text">{summary}</span>
      </button>

      {open && timelineEntries.length > 0 ? (
        <div className={conversationDensityClassNames.timelineList}>
          {timelineEntries.map((entry, index) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              defaultOpen={
                defaultOpen &&
                entry.status === MESSAGE_STATUS.STREAMING &&
                index === timelineEntries.length - 1
              }
            />
          ))}
        </div>
      ) : null}

      {open && timelineEntries.length === 0 && runtimeStatus ? (
        <p className="mt-2 border-t border-app-border/55 pt-2 text-[11px] leading-4.5 text-app-muted-strong">
          {runtimeStatus}
        </p>
      ) : null}
    </div>
  );
}
