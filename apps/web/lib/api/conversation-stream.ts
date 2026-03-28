import {
  CONVERSATION_STREAM_EVENT,
  MESSAGE_ROLE,
  MESSAGE_STATUS,
  type ConversationStreamEvent,
  type MessageStatus,
} from "@knowledge-assistant/contracts";

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

type ToolMessageEvent = Extract<
  ConversationStreamEvent,
  { type: typeof CONVERSATION_STREAM_EVENT.TOOL_MESSAGE }
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

export function buildAssistantDeltaStreamEvent(input: {
  conversationId: string;
  assistantMessage: AssistantMessageRow;
}): AnswerDeltaEvent {
  return {
    type: CONVERSATION_STREAM_EVENT.ANSWER_DELTA,
    conversation_id: input.conversationId,
    message_id: input.assistantMessage.id,
    status: input.assistantMessage.status,
    content_markdown: input.assistantMessage.contentMarkdown,
  };
}

export function readAssistantRunError(message: Pick<
  AssistantMessageRow,
  "contentMarkdown" | "structuredJson"
>) {
  const structured = message.structuredJson ?? null;
  const error =
    typeof structured?.agent_error === "string" ? structured.agent_error.trim() : "";

  return error || message.contentMarkdown;
}

export function buildAssistantTerminalStreamEvent(input: {
  conversationId: string;
  assistantMessage: AssistantMessageRow | null;
}): AnswerDoneEvent | RunFailedEvent | null {
  if (!input.assistantMessage) {
    return {
      type: CONVERSATION_STREAM_EVENT.RUN_FAILED,
      conversation_id: input.conversationId,
      message_id: null,
      error: "Assistant message not found.",
    };
  }

  if (input.assistantMessage.status === MESSAGE_STATUS.COMPLETED) {
    return {
      type: CONVERSATION_STREAM_EVENT.ANSWER_DONE,
      conversation_id: input.conversationId,
      message_id: input.assistantMessage.id,
    };
  }

  if (input.assistantMessage.status === MESSAGE_STATUS.FAILED) {
    return {
      type: CONVERSATION_STREAM_EVENT.RUN_FAILED,
      conversation_id: input.conversationId,
      message_id: input.assistantMessage.id,
      error: readAssistantRunError(input.assistantMessage),
    };
  }

  return null;
}
