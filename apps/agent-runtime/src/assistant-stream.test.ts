import { describe, expect, test } from "vitest";

import { extractAssistantTextDelta } from "./assistant-stream";

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
