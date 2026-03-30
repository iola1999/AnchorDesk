import { describe, expect, test } from "vitest";

import {
  buildAssistantFailedMessageState,
  buildRunFailedToolMessageState,
} from "./conversation-message-state";

describe("buildAssistantFailedMessageState", () => {
  test("normalizes the agent-facing failure payload", () => {
    expect(buildAssistantFailedMessageState("queue offline")).toEqual({
      status: "failed",
      contentMarkdown: "Agent 处理失败：queue offline",
      structuredJson: {
        agent_error: "queue offline",
      },
    });
  });
});

describe("buildRunFailedToolMessageState", () => {
  test("normalizes the timeline failure payload", () => {
    expect(buildRunFailedToolMessageState("queue offline")).toEqual({
      status: "failed",
      contentMarkdown: "运行失败：queue offline",
      structuredJson: {
        timeline_event: "run_failed",
        error: "queue offline",
      },
    });
  });
});
