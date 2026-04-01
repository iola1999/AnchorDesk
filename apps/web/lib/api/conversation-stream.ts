import {
  readStreamingAssistantRunState,
  CONVERSATION_STREAM_EVENT,
  MESSAGE_ROLE,
  MESSAGE_STATUS,
  normalizeConversationFailureMessage,
  type ConversationStreamEvent,
  type KnowledgeSourceScope,
  type MessageStatus,
} from "@anchordesk/contracts";

type ToolMessageRow = {
  id: string;
  status: MessageStatus;
  contentMarkdown: string;
  createdAt: Date;
  structuredJson?: Record<string, unknown> | null;
};

type AssistantMessageRow = {
  id: string;
  status: MessageStatus;
  contentMarkdown: string;
  structuredJson?: Record<string, unknown> | null;
};

type AssistantCitationRow = {
  id: string;
  anchorId?: string | null;
  documentId?: string | null;
  label: string;
  quoteText: string;
  sourceScope?: KnowledgeSourceScope | null;
  libraryTitle?: string | null;
  sourceUrl?: string | null;
  sourceDomain?: string | null;
  sourceTitle?: string | null;
};

type ToolMessageEvent = Extract<
  ConversationStreamEvent,
  { type: typeof CONVERSATION_STREAM_EVENT.TOOL_MESSAGE }
>;
type AssistantStatusEvent = Extract<
  ConversationStreamEvent,
  { type: typeof CONVERSATION_STREAM_EVENT.ASSISTANT_STATUS }
>;
type AssistantThinkingDeltaEvent = Extract<
  ConversationStreamEvent,
  { type: typeof CONVERSATION_STREAM_EVENT.ASSISTANT_THINKING_DELTA }
>;
type ToolProgressEvent = Extract<
  ConversationStreamEvent,
  { type: typeof CONVERSATION_STREAM_EVENT.TOOL_PROGRESS }
>;
type AnswerDeltaEvent = Extract<
  ConversationStreamEvent,
  { type: typeof CONVERSATION_STREAM_EVENT.ANSWER_DELTA }
>;
type AnswerDoneEvent = Extract<
  ConversationStreamEvent,
  { type: typeof CONVERSATION_STREAM_EVENT.ANSWER_DONE }
>;
type RunFailedEvent = Extract<
  ConversationStreamEvent,
  { type: typeof CONVERSATION_STREAM_EVENT.RUN_FAILED }
>;

export function buildToolMessageStreamEvent(message: ToolMessageRow): ToolMessageEvent {
  return {
    type: CONVERSATION_STREAM_EVENT.TOOL_MESSAGE,
    message_id: message.id,
    role: MESSAGE_ROLE.TOOL,
    status: message.status,
    content_markdown: message.contentMarkdown,
    created_at: message.createdAt.toISOString(),
    structured: message.structuredJson ?? null,
  };
}

export function buildAssistantStatusStreamEvent(input: {
  conversationId: string;
  assistantMessage: AssistantMessageRow;
}): AssistantStatusEvent | null {
  const runState = readStreamingAssistantRunState(input.assistantMessage.structuredJson ?? null);

  if (!runState || (!runState.status_text && !runState.phase)) {
    return null;
  }

  return {
    type: CONVERSATION_STREAM_EVENT.ASSISTANT_STATUS,
    conversation_id: input.conversationId,
    message_id: input.assistantMessage.id,
    status: input.assistantMessage.status,
    phase: runState.phase ?? null,
    status_text: runState.status_text ?? null,
    tool_name: runState.active_tool_name ?? null,
    tool_use_id: runState.active_tool_use_id ?? null,
    task_id: runState.active_task_id ?? null,
  };
}

export function buildAssistantThinkingStreamEvent(input: {
  conversationId: string;
  assistantMessage: AssistantMessageRow;
  deltaText?: string | null;
}): AssistantThinkingDeltaEvent | null {
  const runState = readStreamingAssistantRunState(input.assistantMessage.structuredJson ?? null);
  const thinkingText = typeof runState?.thinking_text === "string" ? runState.thinking_text : "";

  if (!thinkingText) {
    return null;
  }

  return {
    type: CONVERSATION_STREAM_EVENT.ASSISTANT_THINKING_DELTA,
    conversation_id: input.conversationId,
    message_id: input.assistantMessage.id,
    status: input.assistantMessage.status,
    thinking_text: thinkingText,
    delta_text: input.deltaText ?? null,
  };
}

export function buildToolProgressStreamEvent(input: {
  conversationId: string;
  assistantMessageId: string;
  toolUseId: string;
  toolName: string;
  elapsedSeconds: number;
  statusText?: string | null;
  taskId?: string | null;
}): ToolProgressEvent {
  return {
    type: CONVERSATION_STREAM_EVENT.TOOL_PROGRESS,
    conversation_id: input.conversationId,
    message_id: input.assistantMessageId,
    tool_use_id: input.toolUseId,
    tool_name: input.toolName,
    elapsed_seconds: input.elapsedSeconds,
    status_text: input.statusText ?? null,
    task_id: input.taskId ?? null,
  };
}

export function buildAssistantDeltaStreamEvent(input: {
  conversationId: string;
  assistantMessage: AssistantMessageRow;
  deltaText?: string | null;
}): AnswerDeltaEvent {
  return {
    type: CONVERSATION_STREAM_EVENT.ANSWER_DELTA,
    conversation_id: input.conversationId,
    message_id: input.assistantMessage.id,
    status: input.assistantMessage.status,
    content_markdown: input.assistantMessage.contentMarkdown,
    delta_text: input.deltaText ?? null,
  };
}

export function readAssistantRunError(message: Pick<
  AssistantMessageRow,
  "contentMarkdown" | "structuredJson"
>) {
  const structured = message.structuredJson ?? null;
  const error =
    typeof structured?.agent_error === "string" ? structured.agent_error.trim() : "";

  return normalizeConversationFailureMessage(error || message.contentMarkdown);
}

export function buildAssistantTerminalStreamEvent(input: {
  conversationId: string;
  assistantMessage: AssistantMessageRow | null;
  citations?: AssistantCitationRow[];
}): AnswerDoneEvent | RunFailedEvent | null {
  if (!input.assistantMessage) {
    return {
      type: CONVERSATION_STREAM_EVENT.RUN_FAILED,
      conversation_id: input.conversationId,
      message_id: null,
      status: MESSAGE_STATUS.FAILED,
      content_markdown: null,
      structured: null,
      citations: [],
      error: "Assistant message not found.",
    };
  }

  if (input.assistantMessage.status === MESSAGE_STATUS.COMPLETED) {
    return {
      type: CONVERSATION_STREAM_EVENT.ANSWER_DONE,
      conversation_id: input.conversationId,
      message_id: input.assistantMessage.id,
      status: MESSAGE_STATUS.COMPLETED,
      content_markdown: input.assistantMessage.contentMarkdown,
      structured: input.assistantMessage.structuredJson ?? null,
      citations: (input.citations ?? []).map((citation) => ({
        id: citation.id,
        anchor_id: citation.anchorId ?? null,
        document_id: citation.documentId ?? null,
        label: citation.label,
        quote_text: citation.quoteText,
        source_scope: citation.sourceScope ?? null,
        library_title: citation.libraryTitle ?? null,
        source_url: citation.sourceUrl ?? null,
        source_domain: citation.sourceDomain ?? null,
        source_title: citation.sourceTitle ?? null,
      })),
    };
  }

  if (input.assistantMessage.status === MESSAGE_STATUS.FAILED) {
    return {
      type: CONVERSATION_STREAM_EVENT.RUN_FAILED,
      conversation_id: input.conversationId,
      message_id: input.assistantMessage.id,
      status: MESSAGE_STATUS.FAILED,
      content_markdown: input.assistantMessage.contentMarkdown,
      structured: input.assistantMessage.structuredJson ?? null,
      citations: [],
      error: readAssistantRunError(input.assistantMessage),
    };
  }

  return null;
}
