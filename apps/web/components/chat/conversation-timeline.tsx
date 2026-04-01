"use client";

import { useEffect, useState } from "react";

import { type MessageStatus } from "@anchordesk/contracts";

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

    if (keys.length === 0) {
      return "对象";
    }

    return keys.length <= 2 ? keys.join("、") : `${keys.slice(0, 2).join("、")} 等 ${keys.length} 项`;
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    if (!normalized) {
      return "字符串";
    }

    return normalized.length > 36 ? `${normalized.slice(0, 36)}...` : normalized;
  }

  return String(value);
}

function resolveTimelineIcon(entry: ConversationTimelineEntryView) {
  switch (entry.icon) {
    case "knowledge":
    case "attachment":
      return <LibraryIcon className="size-4" />;
    case "web":
      return <GlobeIcon className="size-4" />;
    case "fetch":
      return <SourceIcon className="size-4" />;
    case "report":
      return <AnswerIcon className="size-4" />;
    default:
      return <SlidersIcon className="size-4" />;
  }
}

function resolveMarkerClasses(entry: ConversationTimelineEntryView) {
  return entry.tone === "danger"
    ? "border-red-200/80 bg-red-50 text-red-700"
    : entry.tone === "active"
      ? "border-amber-200/80 bg-amber-50 text-amber-800"
      : entry.tone === "success"
        ? "border-emerald-200/80 bg-white text-emerald-800"
        : "border-app-border/70 bg-white text-app-muted-strong";
}

function resolveCardClasses(entry: ConversationTimelineEntryView) {
  return entry.tone === "danger"
    ? "border-red-200/80 bg-red-50/60"
    : entry.tone === "active"
      ? "border-amber-200/80 bg-amber-50/52"
      : entry.tone === "success"
        ? "border-app-border/70 bg-white/92"
        : "border-app-border/70 bg-white/84";
}

function resolveStatusClasses(entry: ConversationTimelineEntryView) {
  return entry.tone === "danger"
    ? "border-red-200/80 bg-red-50/80 text-red-700"
    : entry.tone === "active"
      ? "border-amber-200/80 bg-amber-50/80 text-amber-800"
      : entry.tone === "success"
        ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-800"
        : "border-app-border/70 bg-white/88 text-app-muted-strong";
}

function resolvePreviewItemClasses(item: ConversationTimelinePreviewItem) {
  return item.tone === "danger"
    ? "border border-red-200/80 bg-red-50/72"
    : item.tone === "warning"
      ? "border border-amber-200/80 bg-amber-50/72"
      : "border border-app-border/60 bg-white/72";
}

function ToolPayloadBlock({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className={conversationDensityClassNames.payloadDisclosure}>
      <div className="flex items-center justify-between gap-3 text-[11px] text-app-muted-strong">
        <span className="font-medium text-app-text">{label}</span>
        <span className="min-w-0 flex-1 truncate text-right text-app-muted">
          {describePayloadPreview(value)}
        </span>
      </div>

      <div className="mt-2 border-t border-app-border/60 pt-2">
        <pre className={conversationDensityClassNames.payloadPre}>
          {formatPayloadValue(value)}
        </pre>
      </div>
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
  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;
  const hiddenCount = typeof limit === "number" ? Math.max(items.length - limit, 0) : 0;

  if (visibleItems.length === 0 && hiddenCount === 0) {
    return null;
  }

  return (
    <ul className={conversationDensityClassNames.timelinePreviewList}>
      {visibleItems.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className={cn(
            conversationDensityClassNames.timelinePreviewItem,
            resolvePreviewItemClasses(item),
          )}
        >
          <div className={conversationDensityClassNames.timelinePreviewLabelRow}>
            <span className="font-medium text-app-muted-strong">{item.label}</span>
            {item.meta ? <span className={conversationDensityClassNames.timelinePreviewMeta}>{item.meta}</span> : null}
          </div>
          <p className={conversationDensityClassNames.timelinePreviewValue}>{item.value}</p>
        </li>
      ))}

      {hiddenCount > 0 ? (
        <li className={cn(conversationDensityClassNames.timelinePreviewItem, "border border-dashed border-app-border/70 bg-white/54")}>
          <div className={conversationDensityClassNames.timelinePreviewLabelRow}>
            <span className="font-medium text-app-muted-strong">其余</span>
          </div>
          <p className={conversationDensityClassNames.timelinePreviewValue}>
            还有 {hiddenCount} 项
          </p>
        </li>
      ) : null}
    </ul>
  );
}

function TimelineEntryCard({
  entry,
  expandable = false,
}: {
  entry: ConversationTimelineEntryView;
  expandable?: boolean;
}) {
  return (
    <div className={conversationDensityClassNames.timelineEntrySummary}>
      <div className={conversationDensityClassNames.timelineEntryRail}>
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full border shadow-[0_8px_18px_rgba(23,22,18,0.04)]",
            resolveMarkerClasses(entry),
          )}
        >
          {resolveTimelineIcon(entry)}
        </span>
      </div>

      <div
        className={cn(
          conversationDensityClassNames.timelineEntryCard,
          resolveCardClasses(entry),
        )}
      >
        <div className={conversationDensityClassNames.timelineEntryHeader}>
          <div className={conversationDensityClassNames.timelineEntryBody}>
            <div className={conversationDensityClassNames.timelineEntryTitleRow}>
              <span className="text-[14px] font-semibold text-app-text">{entry.displayName}</span>
              <span
                className={cn(
                  conversationDensityClassNames.timelineStatusPill,
                  resolveStatusClasses(entry),
                )}
              >
                {entry.statusLabel}
              </span>
            </div>

            {entry.arguments.length > 0 ? (
              <div className={conversationDensityClassNames.timelineArgumentList}>
                {entry.arguments.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className={conversationDensityClassNames.timelineArgument}
                  >
                    <span className={conversationDensityClassNames.timelineArgumentLabel}>
                      {item.label}
                    </span>
                    <span className={conversationDensityClassNames.timelineArgumentValue}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {entry.previewSummary ? (
              <p className={conversationDensityClassNames.timelineSummaryText}>
                {entry.previewSummary}
              </p>
            ) : null}

            <TimelinePreviewList items={entry.previewItems} limit={3} />
          </div>

          <div className="flex shrink-0 items-start gap-2">
            <span className={conversationDensityClassNames.timelineEntryTime}>
              {formatTimeRange(entry.createdAt, entry.completedAt)}
            </span>
            {expandable ? (
              <span className="pt-0.5 text-app-muted transition group-open/timeline-entry:rotate-180">
                <ChevronDownIcon className="size-4" />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationTimeline({
  timelineMessages,
  runtimeStatus,
  defaultOpen = false,
}: {
  timelineMessages: TimelineMessage[];
  runtimeStatus?: string | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const timelineEntries = buildAssistantProcessTimelineEntries(timelineMessages).map(
    buildConversationTimelineEntryView,
  );

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
    <details
      className={conversationDensityClassNames.timelineShell}
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 text-[13px] text-app-muted-strong [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2 font-medium text-app-text">
          <span className="text-app-muted transition group-open:rotate-180">
            <ChevronDownIcon className="size-4" />
          </span>
          {summary}
        </span>
      </summary>

      {timelineEntries.length > 0 ? (
        <div className={conversationDensityClassNames.timelineList}>
          {timelineEntries.map((entry) => {
            const expandable = canExpandConversationTimelineEntry(entry);

            if (!expandable) {
              return (
                <article key={entry.id} className={conversationDensityClassNames.timelineEntry}>
                  <TimelineEntryCard entry={entry} />
                </article>
              );
            }

            return (
              <details
                key={entry.id}
                className={conversationDensityClassNames.timelineEntry}
              >
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <TimelineEntryCard entry={entry} expandable />
                </summary>

                <div className={conversationDensityClassNames.timelineEntryDetails}>
                  <div />
                  <div className={conversationDensityClassNames.timelineEntryDetailsPanel}>
                    {entry.previewItems.length > 0 ? (
                      <section className={conversationDensityClassNames.timelineEntrySection}>
                        <h4 className={conversationDensityClassNames.timelineEntrySectionTitle}>
                          结果摘要
                        </h4>
                        <TimelinePreviewList items={entry.previewItems} />
                      </section>
                    ) : null}

                    {entry.input !== null ? (
                      <ToolPayloadBlock label="原始入参" value={entry.input} />
                    ) : null}

                    {entry.output !== null ? (
                      <ToolPayloadBlock label="原始结果" value={entry.output} />
                    ) : null}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      ) : null}

      {timelineEntries.length === 0 && runtimeStatus ? (
        <p className={cn(ui.muted, "mt-3 border-t border-app-border/55 pt-3 text-[12px]")}>
          {runtimeStatus}
        </p>
      ) : null}
    </details>
  );
}
