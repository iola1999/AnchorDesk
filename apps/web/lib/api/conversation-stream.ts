import type { ConversationStreamEvent } from "@knowledge-assistant/contracts";

type ToolMessageRow = {
  id: string;
  status: "streaming" | "completed" | "failed";
  contentMarkdown: string;
  createdAt: Date;
  structuredJson?: Record<string, unknown> | null;
};

type AssistantMessageRow = {
  id: string;
  status: "streaming" | "completed" | "failed";
  contentMarkdown: string;
  structuredJson?: Record<string, unknown> | null;
};

type ToolMessageEvent = Extract<ConversationStreamEvent, { type: "tool_message" }>;
type AnswerDoneEvent = Extract<ConversationStreamEvent, { type: "answer_done" }>;
type RunFailedEvent = Extract<ConversationStreamEvent, { type: "run_failed" }>;

export function buildToolMessageStreamEvent(message: ToolMessageRow): ToolMessageEvent {
  return {
    type: "tool_message",
    message_id: message.id,
    role: "tool",
    status: message.status,
    content_markdown: message.contentMarkdown,
    created_at: message.createdAt.toISOString(),
    structured: message.structuredJson ?? null,
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
      type: "run_failed",
      conversation_id: input.conversationId,
      message_id: null,
      error: "Assistant message not found.",
    };
  }

  if (input.assistantMessage.status === "completed") {
    return {
      type: "answer_done",
      conversation_id: input.conversationId,
      message_id: input.assistantMessage.id,
    };
  }

  if (input.assistantMessage.status === "failed") {
    return {
      type: "run_failed",
      conversation_id: input.conversationId,
      message_id: input.assistantMessage.id,
      error: readAssistantRunError(input.assistantMessage),
    };
  }

  return null;
}
