import { describe, expect, test } from "vitest";

import { MESSAGE_STATUS } from "@anchordesk/contracts";

import {
  canExpandConversationTimelineEntry,
  describeConversationTimelineEntryDetailsLabel,
  type ConversationTimelineEntryView,
} from "./conversation-timeline";

const baseEntry: ConversationTimelineEntryView = {
  id: "tool-1",
  kind: "tool_call",
  toolName: "fetch_source",
  status: MESSAGE_STATUS.COMPLETED,
  createdAt: "2026-03-30T12:00:00.000Z",
  completedAt: "2026-03-30T12:00:01.000Z",
  contentMarkdown: "已收到工具结果",
  input: null,
  output: null,
  error: null,
};

describe("canExpandConversationTimelineEntry", () => {
  test("expands tool calls when input or output payload exists", () => {
    expect(
      canExpandConversationTimelineEntry({
        ...baseEntry,
        input: { url: "https://example.com" },
      }),
    ).toBe(true);
    expect(
      canExpandConversationTimelineEntry({
        ...baseEntry,
        output: { title: "example" },
      }),
    ).toBe(true);
  });

  test("keeps plain status rows collapsed", () => {
    expect(
      canExpandConversationTimelineEntry({
        ...baseEntry,
        kind: "status_event",
      }),
    ).toBe(false);
    expect(canExpandConversationTimelineEntry(baseEntry)).toBe(false);
  });
});

describe("describeConversationTimelineEntryDetailsLabel", () => {
  test("describes combined input and output payloads compactly", () => {
    expect(
      describeConversationTimelineEntryDetailsLabel({
        ...baseEntry,
        input: { url: "https://example.com" },
        output: { title: "example" },
      }),
    ).toBe("查看入参与结果");
  });

  test("falls back to the single available payload", () => {
    expect(
      describeConversationTimelineEntryDetailsLabel({
        ...baseEntry,
        input: { url: "https://example.com" },
      }),
    ).toBe("查看入参");
    expect(
      describeConversationTimelineEntryDetailsLabel({
        ...baseEntry,
        output: { title: "example" },
      }),
    ).toBe("查看结果");
  });
});
