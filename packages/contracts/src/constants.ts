type ValueOf<T> = T[keyof T];

export const WORKSPACE_MODE = {
  KB_ONLY: "kb_only",
  KB_PLUS_WEB: "kb_plus_web",
} as const;
export const WORKSPACE_MODE_VALUES = [
  WORKSPACE_MODE.KB_ONLY,
  WORKSPACE_MODE.KB_PLUS_WEB,
] as const;
export type WorkspaceMode = ValueOf<typeof WORKSPACE_MODE>;
export const DEFAULT_WORKSPACE_MODE = WORKSPACE_MODE.KB_ONLY;

export const DOCUMENT_STATUS = {
  UPLOADING: "uploading",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
  ARCHIVED: "archived",
} as const;
export const DOCUMENT_STATUS_VALUES = [
  DOCUMENT_STATUS.UPLOADING,
  DOCUMENT_STATUS.PROCESSING,
  DOCUMENT_STATUS.READY,
  DOCUMENT_STATUS.FAILED,
  DOCUMENT_STATUS.ARCHIVED,
] as const;
export type DocumentStatus = ValueOf<typeof DOCUMENT_STATUS>;
export const DEFAULT_DOCUMENT_STATUS = DOCUMENT_STATUS.UPLOADING;

export const DOCUMENT_TYPE = {
  REFERENCE: "reference",
  GUIDE: "guide",
  POLICY: "policy",
  SPEC: "spec",
  REPORT: "report",
  NOTE: "note",
  EMAIL: "email",
  MEETING_NOTE: "meeting_note",
  OTHER: "other",
} as const;
export const DOCUMENT_TYPE_VALUES = [
  DOCUMENT_TYPE.REFERENCE,
  DOCUMENT_TYPE.GUIDE,
  DOCUMENT_TYPE.POLICY,
  DOCUMENT_TYPE.SPEC,
  DOCUMENT_TYPE.REPORT,
  DOCUMENT_TYPE.NOTE,
  DOCUMENT_TYPE.EMAIL,
  DOCUMENT_TYPE.MEETING_NOTE,
  DOCUMENT_TYPE.OTHER,
] as const;
export type DocumentType = ValueOf<typeof DOCUMENT_TYPE>;
export const DEFAULT_DOCUMENT_TYPE = DOCUMENT_TYPE.OTHER;

export const PARSE_STATUS = {
  QUEUED: "queued",
  EXTRACTING_TEXT: "extracting_text",
  PARSING_LAYOUT: "parsing_layout",
  CHUNKING: "chunking",
  EMBEDDING: "embedding",
  INDEXING: "indexing",
  READY: "ready",
  FAILED: "failed",
} as const;
export const PARSE_STATUS_VALUES = [
  PARSE_STATUS.QUEUED,
  PARSE_STATUS.EXTRACTING_TEXT,
  PARSE_STATUS.PARSING_LAYOUT,
  PARSE_STATUS.CHUNKING,
  PARSE_STATUS.EMBEDDING,
  PARSE_STATUS.INDEXING,
  PARSE_STATUS.READY,
  PARSE_STATUS.FAILED,
] as const;
export type ParseStatus = ValueOf<typeof PARSE_STATUS>;
export const DEFAULT_PARSE_STATUS = PARSE_STATUS.QUEUED;

export const CONVERSATION_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;
export const CONVERSATION_STATUS_VALUES = [
  CONVERSATION_STATUS.ACTIVE,
  CONVERSATION_STATUS.ARCHIVED,
] as const;
export type ConversationStatus = ValueOf<typeof CONVERSATION_STATUS>;
export const DEFAULT_CONVERSATION_STATUS = CONVERSATION_STATUS.ACTIVE;

export const MESSAGE_ROLE = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
  TOOL: "tool",
} as const;
export const MESSAGE_ROLE_VALUES = [
  MESSAGE_ROLE.SYSTEM,
  MESSAGE_ROLE.USER,
  MESSAGE_ROLE.ASSISTANT,
  MESSAGE_ROLE.TOOL,
] as const;
export type MessageRole = ValueOf<typeof MESSAGE_ROLE>;

export const MESSAGE_STATUS = {
  STREAMING: "streaming",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
export const MESSAGE_STATUS_VALUES = [
  MESSAGE_STATUS.STREAMING,
  MESSAGE_STATUS.COMPLETED,
  MESSAGE_STATUS.FAILED,
] as const;
export type MessageStatus = ValueOf<typeof MESSAGE_STATUS>;
export const DEFAULT_MESSAGE_STATUS = MESSAGE_STATUS.COMPLETED;

export const REPORT_STATUS = {
  DRAFT: "draft",
  GENERATING: "generating",
  READY: "ready",
  FAILED: "failed",
  EXPORTED: "exported",
} as const;
export const REPORT_STATUS_VALUES = [
  REPORT_STATUS.DRAFT,
  REPORT_STATUS.GENERATING,
  REPORT_STATUS.READY,
  REPORT_STATUS.FAILED,
  REPORT_STATUS.EXPORTED,
] as const;
export type ReportStatus = ValueOf<typeof REPORT_STATUS>;
export const DEFAULT_REPORT_STATUS = REPORT_STATUS.DRAFT;

export const RUN_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;
export const RUN_STATUS_VALUES = [
  RUN_STATUS.QUEUED,
  RUN_STATUS.RUNNING,
  RUN_STATUS.COMPLETED,
  RUN_STATUS.FAILED,
  RUN_STATUS.CANCELLED,
] as const;
export type RunStatus = ValueOf<typeof RUN_STATUS>;
export const DEFAULT_RUN_STATUS = RUN_STATUS.QUEUED;

export const GROUNDED_ANSWER_CONFIDENCE = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;
export const GROUNDED_ANSWER_CONFIDENCE_VALUES = [
  GROUNDED_ANSWER_CONFIDENCE.HIGH,
  GROUNDED_ANSWER_CONFIDENCE.MEDIUM,
  GROUNDED_ANSWER_CONFIDENCE.LOW,
] as const;
export type GroundedAnswerConfidence = ValueOf<typeof GROUNDED_ANSWER_CONFIDENCE>;
export const DEFAULT_GROUNDED_ANSWER_CONFIDENCE = GROUNDED_ANSWER_CONFIDENCE.LOW;

export const TOOL_TIMELINE_STATE = {
  STARTED: "started",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
export const TOOL_TIMELINE_STATE_VALUES = [
  TOOL_TIMELINE_STATE.STARTED,
  TOOL_TIMELINE_STATE.COMPLETED,
  TOOL_TIMELINE_STATE.FAILED,
] as const;
export type ToolTimelineState = ValueOf<typeof TOOL_TIMELINE_STATE>;

export const TIMELINE_EVENT = {
  TOOL_STARTED: "tool_started",
  TOOL_FINISHED: "tool_finished",
  TOOL_FAILED: "tool_failed",
  RUN_FAILED: "run_failed",
} as const;
export type TimelineEvent = ValueOf<typeof TIMELINE_EVENT>;

export const CONVERSATION_STREAM_EVENT = {
  TOOL_MESSAGE: "tool_message",
  ANSWER_DONE: "answer_done",
  RUN_FAILED: "run_failed",
} as const;
export const CONVERSATION_STREAM_EVENT_VALUES = [
  CONVERSATION_STREAM_EVENT.TOOL_MESSAGE,
  CONVERSATION_STREAM_EVENT.ANSWER_DONE,
  CONVERSATION_STREAM_EVENT.RUN_FAILED,
] as const;
export type ConversationStreamEventType = ValueOf<typeof CONVERSATION_STREAM_EVENT>;

export const ASSISTANT_MCP_SERVER_NAME = "assistant";
export const ASSISTANT_TOOL = {
  SEARCH_WORKSPACE_KNOWLEDGE: "search_workspace_knowledge",
  READ_CITATION_ANCHOR: "read_citation_anchor",
  SEARCH_STATUTES: "search_statutes",
  SEARCH_WEB_GENERAL: "search_web_general",
  FETCH_SOURCE: "fetch_source",
  CREATE_REPORT_OUTLINE: "create_report_outline",
  WRITE_REPORT_SECTION: "write_report_section",
} as const;
export const ASSISTANT_TOOL_VALUES = [
  ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE,
  ASSISTANT_TOOL.READ_CITATION_ANCHOR,
  ASSISTANT_TOOL.SEARCH_STATUTES,
  ASSISTANT_TOOL.SEARCH_WEB_GENERAL,
  ASSISTANT_TOOL.FETCH_SOURCE,
  ASSISTANT_TOOL.CREATE_REPORT_OUTLINE,
  ASSISTANT_TOOL.WRITE_REPORT_SECTION,
] as const;
export type AssistantToolName = ValueOf<typeof ASSISTANT_TOOL>;

export const ASSISTANT_MCP_TOOL_PREFIX = `mcp__${ASSISTANT_MCP_SERVER_NAME}__`;
export const ASSISTANT_COMPAT_TOOL_PREFIX = `${ASSISTANT_MCP_SERVER_NAME}__`;
export const ASSISTANT_MCP_TOOL = {
  SEARCH_WORKSPACE_KNOWLEDGE: `${ASSISTANT_MCP_TOOL_PREFIX}${ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE}`,
  READ_CITATION_ANCHOR: `${ASSISTANT_MCP_TOOL_PREFIX}${ASSISTANT_TOOL.READ_CITATION_ANCHOR}`,
  SEARCH_STATUTES: `${ASSISTANT_MCP_TOOL_PREFIX}${ASSISTANT_TOOL.SEARCH_STATUTES}`,
  SEARCH_WEB_GENERAL: `${ASSISTANT_MCP_TOOL_PREFIX}${ASSISTANT_TOOL.SEARCH_WEB_GENERAL}`,
  FETCH_SOURCE: `${ASSISTANT_MCP_TOOL_PREFIX}${ASSISTANT_TOOL.FETCH_SOURCE}`,
  CREATE_REPORT_OUTLINE: `${ASSISTANT_MCP_TOOL_PREFIX}${ASSISTANT_TOOL.CREATE_REPORT_OUTLINE}`,
  WRITE_REPORT_SECTION: `${ASSISTANT_MCP_TOOL_PREFIX}${ASSISTANT_TOOL.WRITE_REPORT_SECTION}`,
} as const;
export type AssistantMcpToolName = ValueOf<typeof ASSISTANT_MCP_TOOL>;

export const KB_ONLY_ALLOWED_TOOL_NAMES = [
  ASSISTANT_MCP_TOOL.SEARCH_WORKSPACE_KNOWLEDGE,
  ASSISTANT_MCP_TOOL.READ_CITATION_ANCHOR,
] as const;
export const KB_PLUS_WEB_ALLOWED_TOOL_NAMES = [
  ...KB_ONLY_ALLOWED_TOOL_NAMES,
  ASSISTANT_MCP_TOOL.SEARCH_STATUTES,
  ASSISTANT_MCP_TOOL.SEARCH_WEB_GENERAL,
  ASSISTANT_MCP_TOOL.FETCH_SOURCE,
  ASSISTANT_MCP_TOOL.CREATE_REPORT_OUTLINE,
  ASSISTANT_MCP_TOOL.WRITE_REPORT_SECTION,
] as const;

export const EMBEDDING_PROVIDER = {
  LOCAL_HASH: "local_hash",
  OPENAI_COMPATIBLE: "openai_compatible",
  DASHSCOPE_COMPATIBLE: "dashscope_compatible",
} as const;
export type EmbeddingProviderName = ValueOf<typeof EMBEDDING_PROVIDER>;
export const EMBEDDING_PROVIDER_ALIAS = {
  DASHSCOPE: "dashscope",
} as const;

export const RERANK_PROVIDER = {
  LOCAL_HEURISTIC: "local_heuristic",
  DASHSCOPE: "dashscope",
} as const;
export type RerankProviderName = ValueOf<typeof RERANK_PROVIDER>;
export const RERANK_PROVIDER_ALIAS = {
  LOCAL: "local",
} as const;

export const DEFAULT_AGENT_MAX_TURNS = 6;
export const DEFAULT_AUTO_REFRESH_INTERVAL_MS = 5_000;
export const DEFAULT_CONVERSATION_STREAM_POLL_INTERVAL_MS = 700;
export const DEFAULT_QUEUE_JOB_RETENTION_LIMIT = 100;
export const DEFAULT_RETRIEVAL_RUN_TOP_K = 6;
export const DEFAULT_SEARCH_WORKSPACE_KNOWLEDGE_TOP_K = 8;
export const MAX_SEARCH_WORKSPACE_KNOWLEDGE_TOP_K = 20;
export const DEFAULT_SEARCH_STATUTES_TOP_K = 5;
export const MAX_SEARCH_STATUTES_TOP_K = 10;
export const DEFAULT_SEARCH_WEB_GENERAL_TOP_K = 5;
export const MAX_SEARCH_WEB_GENERAL_TOP_K = 10;
export const DEFAULT_STATUTES_JURISDICTION = "CN";
export const DEFAULT_FETCH_SOURCE_PARAGRAPH_LIMIT = 50;
export const DEFAULT_EMBEDDING_BATCH_SIZE = 16;
export const DEFAULT_DASHSCOPE_EMBEDDING_BATCH_SIZE = 10;
export const DEFAULT_QDRANT_COLLECTION_NAME = "knowledge_chunks";
export const DEFAULT_HASH_VECTOR_SIZE = 256;
export const DEFAULT_QUERY_CANDIDATE_LIMIT = 36;
export const DEFAULT_QUERY_CANDIDATE_MULTIPLIER = 6;

export function isWorkspaceMode(value: unknown): value is WorkspaceMode {
  return (
    typeof value === "string" &&
    WORKSPACE_MODE_VALUES.includes(value as WorkspaceMode)
  );
}

export function normalizeWorkspaceMode(value: string | null | undefined): WorkspaceMode {
  return isWorkspaceMode(value) ? value : DEFAULT_WORKSPACE_MODE;
}

export function isGroundedAnswerConfidence(
  value: unknown,
): value is GroundedAnswerConfidence {
  return (
    typeof value === "string" &&
    GROUNDED_ANSWER_CONFIDENCE_VALUES.includes(
      value as GroundedAnswerConfidence,
    )
  );
}

export function isAssistantToolName(value: string): value is AssistantToolName {
  return ASSISTANT_TOOL_VALUES.includes(value as AssistantToolName);
}

export function normalizeAssistantToolName(toolName: string) {
  return toolName
    .replace(new RegExp(`^${ASSISTANT_MCP_TOOL_PREFIX}`), "")
    .replace(new RegExp(`^${ASSISTANT_COMPAT_TOOL_PREFIX}`), "")
    .trim();
}
