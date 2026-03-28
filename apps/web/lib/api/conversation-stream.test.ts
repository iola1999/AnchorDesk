import { describe, expect, test } from "vitest";

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
        status: "completed",
        contentMarkdown: "工具执行完成：search_workspace_knowledge",
        createdAt: new Date("2026-03-28T09:30:00.000Z"),
        structuredJson: {
          timeline_event: "tool_finished",
          tool_name: "search_workspace_knowledge",
        },
      }),
    ).toEqual({
      type: "tool_message",
      message_id: "tool-message-1",
      role: "tool",
      status: "completed",
      content_markdown: "工具执行完成：search_workspace_knowledge",
      created_at: "2026-03-28T09:30:00.000Z",
      structured: {
        timeline_event: "tool_finished",
        tool_name: "search_workspace_knowledge",
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
          confidence: "low",
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
          status: "completed",
          contentMarkdown: "final answer",
          structuredJson: null,
        },
      }),
    ).toEqual({
      type: "answer_done",
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
          status: "failed",
          contentMarkdown: "Agent 处理失败：fallback",
          structuredJson: {
            agent_error: "grounded answer render failed",
          },
        },
      }),
    ).toEqual({
      type: "run_failed",
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
      type: "run_failed",
      conversation_id: "conversation-1",
      message_id: null,
      error: "Assistant message not found.",
    });
  });
});
