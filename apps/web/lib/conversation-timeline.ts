import { ASSISTANT_TOOL, MESSAGE_STATUS } from "@anchordesk/contracts";

import type { AssistantProcessTimelineEntry } from "@/lib/api/conversation-process";

type TimelinePreviewTone = "default" | "warning" | "danger";
type TimelineEntryTone = "neutral" | "active" | "success" | "danger";
type TimelineEntryIcon =
  | "attachment"
  | "fetch"
  | "knowledge"
  | "report"
  | "status"
  | "web";

type TimelineRecord = Record<string, unknown>;

export type ConversationTimelineArgument = {
  label: string;
  value: string;
};

export type ConversationTimelinePreviewItem = {
  label: string;
  value: string;
  meta: string | null;
  tone: TimelinePreviewTone;
};

export type ConversationTimelineEntryView = AssistantProcessTimelineEntry & {
  displayName: string;
  statusLabel: string;
  tone: TimelineEntryTone;
  icon: TimelineEntryIcon;
  arguments: ConversationTimelineArgument[];
  previewSummary: string | null;
  previewItems: ConversationTimelinePreviewItem[];
};

function isRecord(value: unknown): value is TimelineRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.replace(/\s+/g, " ").trim()
    : null;
}

function readString(value: unknown) {
  return cleanText(value);
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function readStringArray(value: unknown) {
  return readArray(value)
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
}

function readToolFailureMessage(output: unknown) {
  const record = readRecord(output);
  if (!record || record.ok !== false) {
    return null;
  }

  return readString(readRecord(record.error)?.message);
}

function readHostname(url: string | null) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function stripMarkdown(markdown: string | null) {
  if (!markdown) {
    return null;
  }

  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPageRange(start: number | null, end: number | null) {
  if (!start && !end) {
    return null;
  }

  if (!start) {
    return end ? `第 ${end} 页` : null;
  }

  if (!end || start === end) {
    return `第 ${start} 页`;
  }

  return `第 ${start}-${end} 页`;
}

function formatUrlBatch(urls: string[]) {
  const labels = urls.map((url) => readHostname(url) ?? url);
  if (labels.length <= 2) {
    return labels.join("、");
  }

  return `${labels.slice(0, 2).join("、")} +${labels.length - 2}`;
}

function buildStatusLabel(status: AssistantProcessTimelineEntry["status"]) {
  return status === MESSAGE_STATUS.STREAMING
    ? "进行中"
    : status === MESSAGE_STATUS.FAILED
      ? "失败"
      : "完成";
}

function buildEntryTone(entry: AssistantProcessTimelineEntry): TimelineEntryTone {
  if (entry.status === MESSAGE_STATUS.FAILED) {
    return "danger";
  }

  if (entry.status === MESSAGE_STATUS.STREAMING) {
    return "active";
  }

  return entry.kind === "status_event" ? "neutral" : "success";
}

function buildEntryIcon(toolName: string | null): TimelineEntryIcon {
  switch (toolName) {
    case ASSISTANT_TOOL.SEARCH_CONVERSATION_ATTACHMENTS:
    case ASSISTANT_TOOL.READ_CONVERSATION_ATTACHMENT_RANGE:
      return "attachment";
    case ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE:
    case ASSISTANT_TOOL.READ_CITATION_ANCHOR:
      return "knowledge";
    case ASSISTANT_TOOL.SEARCH_STATUTES:
    case ASSISTANT_TOOL.SEARCH_WEB_GENERAL:
      return "web";
    case ASSISTANT_TOOL.FETCH_SOURCE:
    case ASSISTANT_TOOL.FETCH_SOURCES:
      return "fetch";
    case ASSISTANT_TOOL.CREATE_REPORT_OUTLINE:
    case ASSISTANT_TOOL.WRITE_REPORT_SECTION:
      return "report";
    default:
      return "status";
  }
}

function buildDisplayName(entry: AssistantProcessTimelineEntry) {
  if (!entry.toolName) {
    return entry.status === MESSAGE_STATUS.FAILED ? "运行失败" : "运行状态";
  }

  switch (entry.toolName) {
    case ASSISTANT_TOOL.SEARCH_CONVERSATION_ATTACHMENTS:
      return "搜索临时附件";
    case ASSISTANT_TOOL.READ_CONVERSATION_ATTACHMENT_RANGE:
      return "读取附件页段";
    case ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE:
      return "搜索资料库";
    case ASSISTANT_TOOL.READ_CITATION_ANCHOR:
      return "读取引用定位";
    case ASSISTANT_TOOL.SEARCH_STATUTES:
      return "搜索法条";
    case ASSISTANT_TOOL.SEARCH_WEB_GENERAL:
      return "搜索网页";
    case ASSISTANT_TOOL.FETCH_SOURCE:
      return "读取网页";
    case ASSISTANT_TOOL.FETCH_SOURCES:
      return "批量读取网页";
    case ASSISTANT_TOOL.CREATE_REPORT_OUTLINE:
      return "生成报告大纲";
    case ASSISTANT_TOOL.WRITE_REPORT_SECTION:
      return "撰写报告章节";
    default:
      return entry.toolName;
  }
}

function buildSearchArguments(input: TimelineRecord | null) {
  if (!input) {
    return [];
  }

  const argumentsList: ConversationTimelineArgument[] = [];
  const query = readString(input.query);
  if (query) {
    argumentsList.push({ label: "关键词", value: query });
  }

  const filters = readRecord(input.filters);
  const directoryPrefix = readString(filters?.directory_prefix);
  if (directoryPrefix) {
    argumentsList.push({ label: "目录", value: directoryPrefix });
  }

  const docTypes = readStringArray(filters?.doc_types);
  if (docTypes.length > 0) {
    argumentsList.push({ label: "类型", value: docTypes.join(" / ") });
  }

  const tags = readStringArray(filters?.tags);
  if (tags.length > 0) {
    argumentsList.push({ label: "标签", value: tags.join(" / ") });
  }

  const jurisdiction = readString(input.jurisdiction);
  if (jurisdiction && jurisdiction.toLowerCase() !== "cn") {
    argumentsList.push({ label: "地区", value: jurisdiction });
  }

  return argumentsList;
}

function buildToolArguments(entry: AssistantProcessTimelineEntry) {
  const input = readRecord(entry.input);
  if (!entry.toolName || !input) {
    return [];
  }

  switch (entry.toolName) {
    case ASSISTANT_TOOL.SEARCH_CONVERSATION_ATTACHMENTS:
    case ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE:
    case ASSISTANT_TOOL.SEARCH_STATUTES:
    case ASSISTANT_TOOL.SEARCH_WEB_GENERAL:
      return buildSearchArguments(input);
    case ASSISTANT_TOOL.FETCH_SOURCE: {
      const url = readString(input.url);
      return url ? [{ label: "链接", value: url }] : [];
    }
    case ASSISTANT_TOOL.FETCH_SOURCES: {
      const urls = readStringArray(input.urls);
      if (urls.length === 0) {
        return [];
      }

      return [
        {
          label: "链接",
          value: urls.length === 1 ? urls[0] : formatUrlBatch(urls),
        },
      ];
    }
    case ASSISTANT_TOOL.READ_CONVERSATION_ATTACHMENT_RANGE: {
      const pageLabel = formatPageRange(
        readNumber(input.page_start),
        readNumber(input.page_end),
      );
      return pageLabel ? [{ label: "页段", value: pageLabel }] : [];
    }
    case ASSISTANT_TOOL.CREATE_REPORT_OUTLINE: {
      const argumentsList: ConversationTimelineArgument[] = [];
      const title = readString(input.title);
      const task = readString(input.task);

      if (title) {
        argumentsList.push({ label: "标题", value: title });
      }

      if (task) {
        argumentsList.push({ label: "任务", value: task });
      }

      return argumentsList;
    }
    case ASSISTANT_TOOL.WRITE_REPORT_SECTION: {
      const instruction = readString(input.instruction);
      return instruction ? [{ label: "指令", value: instruction }] : [];
    }
    default:
      return [];
  }
}

function buildWebSearchPreview(output: TimelineRecord | null) {
  const results = readArray(output?.results)
    .map((item) => readRecord(item))
    .filter((item): item is TimelineRecord => Boolean(item));

  if (results.length === 0) {
    return {
      previewSummary: "未命中候选链接",
      previewItems: [],
    };
  }

  return {
    previewSummary: `命中 ${results.length} 条候选链接`,
    previewItems: results.map((result, index) => ({
      label: `结果 ${index + 1}`,
      value: readString(result.title) ?? readString(result.url) ?? `候选链接 ${index + 1}`,
      meta: readString(result.domain) ?? readHostname(readString(result.url)),
      tone: "default" as const,
    })),
  };
}

function buildStatutesPreview(output: TimelineRecord | null) {
  const results = readArray(output?.results)
    .map((item) => readRecord(item))
    .filter((item): item is TimelineRecord => Boolean(item));

  if (results.length === 0) {
    return {
      previewSummary: "未命中法规结果",
      previewItems: [],
    };
  }

  return {
    previewSummary: `命中 ${results.length} 条法规结果`,
    previewItems: results.map((result, index) => ({
      label: `结果 ${index + 1}`,
      value: readString(result.title) ?? `法规 ${index + 1}`,
      meta:
        [readString(result.publisher), readString(result.effective_status)]
          .filter((value): value is string => Boolean(value))
          .join(" · ") || null,
      tone: "default" as const,
    })),
  };
}

function buildKnowledgePreview(output: TimelineRecord | null, noun: string) {
  const results = readArray(output?.results)
    .map((item) => readRecord(item))
    .filter((item): item is TimelineRecord => Boolean(item));

  if (results.length === 0) {
    return {
      previewSummary: `未命中${noun}`,
      previewItems: [],
    };
  }

  return {
    previewSummary: `命中 ${results.length} 条${noun}`,
    previewItems: results.map((result, index) => {
      const documentTitle = readString(result.document_title);
      const pageLabel = formatPageRange(readNumber(result.page_no), readNumber(result.page_no));
      const snippet = readString(result.snippet);

      return {
        label: `片段 ${index + 1}`,
        value: snippet ?? documentTitle ?? `片段 ${index + 1}`,
        meta:
          [documentTitle, pageLabel]
            .filter((value): value is string => Boolean(value))
            .join(" · ") || null,
        tone: "default" as const,
      };
    }),
  };
}

function buildFetchSourcePreview(output: TimelineRecord | null) {
  const source = readRecord(output?.source);
  if (!source) {
    return {
      previewSummary: "已抓取网页正文",
      previewItems: [],
    };
  }

  const url = readString(source.url);
  const title = readString(source.title) ?? readHostname(url) ?? "网页内容";
  const paragraphs = readArray(source.paragraphs)
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));

  const previewItems: ConversationTimelinePreviewItem[] = [
    {
      label: "页面",
      value: title,
      meta: readHostname(url),
      tone: "default",
    },
  ];

  if (paragraphs[0]) {
    previewItems.push({
      label: "摘录",
      value: paragraphs[0],
      meta: null,
      tone: "default",
    });
  }

  return {
    previewSummary: "已抓取网页正文",
    previewItems,
  };
}

function buildFetchSourcesPreview(output: TimelineRecord | null) {
  const sources = readArray(output?.sources)
    .map((item) => readRecord(item))
    .filter((item): item is TimelineRecord => Boolean(item));
  const failures = readArray(output?.failures)
    .map((item) => readRecord(item))
    .filter((item): item is TimelineRecord => Boolean(item));

  if (sources.length === 0 && failures.length === 0) {
    return {
      previewSummary: "未返回网页内容",
      previewItems: [],
    };
  }

  const previewItems: ConversationTimelinePreviewItem[] = sources.map((source, index) => ({
    label: `页面 ${index + 1}`,
    value: readString(source.title) ?? readString(source.url) ?? `网页 ${index + 1}`,
    meta: readHostname(readString(source.url)),
    tone: "default",
  }));

  if (failures.length > 0) {
    const firstFailure = failures[0];
    previewItems.push({
      label: "失败",
      value: readString(firstFailure.url) ?? "链接抓取失败",
      meta: readString(readRecord(firstFailure.error)?.message),
      tone: "warning",
    });
  }

  const summary =
    failures.length > 0
      ? `已抓取 ${sources.length} 个网页，${failures.length} 个失败`
      : `已抓取 ${sources.length} 个网页`;

  return {
    previewSummary: summary,
    previewItems,
  };
}

function buildAttachmentRangePreview(output: TimelineRecord | null) {
  const document = readRecord(output?.document);
  if (!document) {
    return {
      previewSummary: "已读取附件页段",
      previewItems: [],
    };
  }

  const title = readString(document.document_title) ?? "附件内容";
  const rangeLabel = formatPageRange(
    readNumber(document.loaded_page_start),
    readNumber(document.loaded_page_end),
  );
  const pages = readArray(document.pages)
    .map((item) => readRecord(item))
    .filter((item): item is TimelineRecord => Boolean(item));

  return {
    previewSummary: rangeLabel ? `${title} · ${rangeLabel}` : title,
    previewItems: pages.map((page, index) => ({
      label:
        formatPageRange(readNumber(page.page_no), readNumber(page.page_no)) ?? `片段 ${index + 1}`,
      value: readString(page.text) ?? `附件片段 ${index + 1}`,
      meta: null,
      tone: "default" as const,
    })),
  };
}

function buildCitationAnchorPreview(output: TimelineRecord | null) {
  const anchor = readRecord(output?.anchor);
  if (!anchor) {
    return {
      previewSummary: "已读取引用上下文",
      previewItems: [],
    };
  }

  const title = readString(anchor.document_title) ?? "引用内容";
  const pageLabel = formatPageRange(readNumber(anchor.page_no), readNumber(anchor.page_no));
  const anchorText = readString(anchor.text);

  return {
    previewSummary:
      [title, pageLabel].filter((value): value is string => Boolean(value)).join(" · ") || title,
    previewItems: anchorText
      ? [
          {
            label: readString(anchor.anchor_label) ?? "引用",
            value: anchorText,
            meta: null,
            tone: "default" as const,
          },
        ]
      : [],
  };
}

function buildReportOutlinePreview(output: TimelineRecord | null) {
  const outline = readRecord(output?.outline);
  const sections = readArray(outline?.sections)
    .map((item) => readRecord(item))
    .filter((item): item is TimelineRecord => Boolean(item));

  if (sections.length === 0) {
    return {
      previewSummary: "已生成报告大纲",
      previewItems: [],
    };
  }

  return {
    previewSummary: `生成 ${sections.length} 个章节`,
    previewItems: sections.map((section, index) => ({
      label: `章节 ${index + 1}`,
      value: readString(section.title) ?? `章节 ${index + 1}`,
      meta: null,
      tone: "default" as const,
    })),
  };
}

function buildReportSectionPreview(output: TimelineRecord | null) {
  const section = readRecord(output?.section);
  const markdown = stripMarkdown(readString(section?.markdown));
  const citations = readArray(section?.citations);

  const previewItems: ConversationTimelinePreviewItem[] = [];
  if (markdown) {
    previewItems.push({
      label: "草稿",
      value: markdown,
      meta: null,
      tone: "default",
    });
  }

  if (citations.length > 0) {
    previewItems.push({
      label: "引用",
      value: `${citations.length} 条证据`,
      meta: null,
      tone: "default",
    });
  }

  return {
    previewSummary: "已生成章节草稿",
    previewItems,
  };
}

function buildGenericPreview(entry: AssistantProcessTimelineEntry) {
  const failureMessage = readToolFailureMessage(entry.output) ?? entry.error;

  if (entry.status === MESSAGE_STATUS.FAILED) {
    return {
      previewSummary: failureMessage ?? "调用失败",
      previewItems: [],
    };
  }

  if (entry.status === MESSAGE_STATUS.STREAMING) {
    return {
      previewSummary: entry.progressText ?? "正在等待工具结果",
      previewItems: [],
    };
  }

  if (!entry.toolName) {
    return {
      previewSummary: failureMessage ?? cleanText(entry.contentMarkdown),
      previewItems: [],
    };
  }

  const output = readRecord(entry.output);

  switch (entry.toolName) {
    case ASSISTANT_TOOL.SEARCH_WEB_GENERAL:
      return buildWebSearchPreview(output);
    case ASSISTANT_TOOL.SEARCH_STATUTES:
      return buildStatutesPreview(output);
    case ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE:
      return buildKnowledgePreview(output, "资料片段");
    case ASSISTANT_TOOL.SEARCH_CONVERSATION_ATTACHMENTS:
      return buildKnowledgePreview(output, "附件片段");
    case ASSISTANT_TOOL.FETCH_SOURCE:
      return buildFetchSourcePreview(output);
    case ASSISTANT_TOOL.FETCH_SOURCES:
      return buildFetchSourcesPreview(output);
    case ASSISTANT_TOOL.READ_CONVERSATION_ATTACHMENT_RANGE:
      return buildAttachmentRangePreview(output);
    case ASSISTANT_TOOL.READ_CITATION_ANCHOR:
      return buildCitationAnchorPreview(output);
    case ASSISTANT_TOOL.CREATE_REPORT_OUTLINE:
      return buildReportOutlinePreview(output);
    case ASSISTANT_TOOL.WRITE_REPORT_SECTION:
      return buildReportSectionPreview(output);
    default:
      return {
        previewSummary: cleanText(entry.contentMarkdown) ?? "已收到工具结果",
        previewItems: [],
      };
  }
}

export function buildConversationTimelineEntryView(
  entry: AssistantProcessTimelineEntry,
): ConversationTimelineEntryView {
  const preview = buildGenericPreview(entry);

  return {
    ...entry,
    displayName: buildDisplayName(entry),
    statusLabel: buildStatusLabel(entry.status),
    tone: buildEntryTone(entry),
    icon: buildEntryIcon(entry.toolName),
    arguments: buildToolArguments(entry),
    previewSummary: preview.previewSummary,
    previewItems: preview.previewItems,
  };
}

export function canExpandConversationTimelineEntry(
  entry: ConversationTimelineEntryView,
) {
  return (
    entry.kind === "tool_call" &&
    (entry.input !== null ||
      entry.output !== null ||
      entry.previewItems.length > 0 ||
      Boolean(entry.previewSummary))
  );
}

export function describeConversationTimelineEntryDetailsLabel(
  entry: ConversationTimelineEntryView,
) {
  if (entry.input !== null || entry.output !== null) {
    return "展开详情";
  }

  if (entry.previewItems.length > 0) {
    return "展开预览";
  }

  return "展开";
}
