import { describe, expect, test } from "vitest";
import {
  ASSISTANT_TOOL,
  CONVERSATION_STREAM_EVENT,
  DEFAULT_GROUNDED_ANSWER_CONFIDENCE,
  MESSAGE_ROLE,
  MESSAGE_STATUS,
  TIMELINE_EVENT,
} from "@knowledge-assistant/contracts";

import {
  buildAssistantTerminalStreamEvent,
  buildToolMessageStreamEvent,
  readAssistantRunError,
} from "./conversation-stream";

describe("buildToolMessageStreamEvent", () => {
  test("serializes tool timeline messages for SSE", () => {
    expect(
      buildToolMessageStreamEvent({
        id: "tool-message-1",
        status: MESSAGE_STATUS.COMPLETED,
        contentMarkdown: `工具执行完成：${ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE}`,
        createdAt: new Date("2026-03-28T09:30:00.000Z"),
        structuredJson: {
          timeline_event: TIMELINE_EVENT.TOOL_FINISHED,
          tool_name: ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE,
        },
      }),
    ).toEqual({
      type: CONVERSATION_STREAM_EVENT.TOOL_MESSAGE,
      message_id: "tool-message-1",
      role: MESSAGE_ROLE.TOOL,
      status: MESSAGE_STATUS.COMPLETED,
      content_markdown: `工具执行完成：${ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE}`,
      created_at: "2026-03-28T09:30:00.000Z",
      structured: {
        timeline_event: TIMELINE_EVENT.TOOL_FINISHED,
        tool_name: ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE,
      },
    });
  });
});

describe("readAssistantRunError", () => {
  test("prefers structured agent_error when present", () => {
    expect(
      readAssistantRunError({
        contentMarkdown: "Agent 处理失败：fallback",
        structuredJson: {
          agent_error: " queue worker offline ",
        },
      }),
    ).toBe("queue worker offline");
  });

  test("falls back to content markdown when structured error is missing", () => {
    expect(
      readAssistantRunError({
        contentMarkdown: "Agent 处理失败：fallback",
        structuredJson: {
          confidence: DEFAULT_GROUNDED_ANSWER_CONFIDENCE,
        },
      }),
    ).toBe("Agent 处理失败：fallback");
  });
});

describe("buildAssistantTerminalStreamEvent", () => {
  test("returns answer_done when assistant message is completed", () => {
    expect(
      buildAssistantTerminalStreamEvent({
        conversationId: "conversation-1",
        assistantMessage: {
          id: "assistant-1",
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "final answer",
          structuredJson: null,
        },
      }),
    ).toEqual({
      type: CONVERSATION_STREAM_EVENT.ANSWER_DONE,
      conversation_id: "conversation-1",
      message_id: "assistant-1",
    });
  });

  test("returns run_failed when assistant message failed", () => {
    expect(
      buildAssistantTerminalStreamEvent({
        conversationId: "conversation-1",
        assistantMessage: {
          id: "assistant-1",
          status: MESSAGE_STATUS.FAILED,
          contentMarkdown: "Agent 处理失败：fallback",
          structuredJson: {
            agent_error: "grounded answer render failed",
          },
        },
      }),
    ).toEqual({
      type: CONVERSATION_STREAM_EVENT.RUN_FAILED,
      conversation_id: "conversation-1",
      message_id: "assistant-1",
      error: "grounded answer render failed",
    });
  });

  test("returns run_failed when assistant message is missing", () => {
    expect(
      buildAssistantTerminalStreamEvent({
        conversationId: "conversation-1",
        assistantMessage: null,
      }),
    ).toEqual({
      type: CONVERSATION_STREAM_EVENT.RUN_FAILED,
      conversation_id: "conversation-1",
      message_id: null,
      error: "Assistant message not found.",
    });
  });
});
