import { describe, expect, test } from "vitest";

import { ASSISTANT_STREAM_PHASE } from "@anchordesk/contracts";

import {
  extractAssistantRuntimeSignal,
  extractAssistantTextDelta,
} from "./assistant-stream";

describe("extractAssistantTextDelta", () => {
  test("reads text deltas from Claude Agent SDK stream events", () => {
    expect(
      extractAssistantTextDelta({
        type: "stream_event",
        event: {
          type: "content_block_delta",
          delta: {
            type: "text_delta",
            text: "你好",
          },
        },
      }),
    ).toBe("你好");
  });

  test("ignores non-text stream events", () => {
    expect(
      extractAssistantTextDelta({
        type: "stream_event",
        event: {
          type: "message_delta",
          delta: {
            stop_reason: "end_turn",
          },
        },
      }),
    ).toBeNull();
  });
});

describe("extractAssistantRuntimeSignal", () => {
  test("reads tool progress messages from Claude Agent SDK", () => {
    expect(
      extractAssistantRuntimeSignal({
        type: "tool_progress",
        tool_use_id: "tool-1",
        tool_name: "fetch_source",
        elapsed_time_seconds: 4.8,
        task_id: "task-1",
      }),
    ).toEqual({
      kind: "tool_progress",
      toolUseId: "tool-1",
      toolName: "fetch_source",
      elapsedSeconds: 4,
      statusText: "正在调用工具 fetch_source · 4s",
      taskId: "task-1",
    });
  });

  test("reads assistant status messages for background tasks", () => {
    expect(
      extractAssistantRuntimeSignal({
        type: "system",
        subtype: "task_progress",
        description: "正在分析用户问题并规划下一步",
        task_id: "task-1",
      }),
    ).toEqual({
      kind: "assistant_status",
      phase: ASSISTANT_STREAM_PHASE.ANALYZING,
      statusText: "正在分析用户问题并规划下一步",
      toolUseId: null,
      toolName: null,
      taskId: "task-1",
    });
  });
});
