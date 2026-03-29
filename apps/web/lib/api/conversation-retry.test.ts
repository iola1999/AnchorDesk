import { describe, expect, test } from "vitest";
import { MESSAGE_ROLE, MESSAGE_STATUS } from "@knowledge-assistant/contracts";

import { findRetryableConversationTurn } from "./conversation-retry";

describe("findRetryableConversationTurn", () => {
  test("returns the latest failed assistant turn and its preceding user prompt", () => {
    expect(
      findRetryableConversationTurn([
        {
          id: "user-1",
          role: MESSAGE_ROLE.USER,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "请总结最新讨论",
        },
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.FAILED,
          contentMarkdown: "Agent 处理失败：queue offline",
        },
      ]),
    ).toEqual({
      assistantMessageId: "assistant-1",
      userMessageId: "user-1",
      promptContent: "请总结最新讨论",
    });
  });

  test("returns null when the latest assistant message is not failed", () => {
    expect(
      findRetryableConversationTurn([
        {
          id: "user-1",
          role: MESSAGE_ROLE.USER,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "请总结最新讨论",
        },
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.COMPLETED,
          contentMarkdown: "总结如下",
        },
      ]),
    ).toBeNull();
  });

  test("returns null when there is no preceding user turn", () => {
    expect(
      findRetryableConversationTurn([
        {
          id: "assistant-1",
          role: MESSAGE_ROLE.ASSISTANT,
          status: MESSAGE_STATUS.FAILED,
          contentMarkdown: "Agent 处理失败：queue offline",
        },
      ]),
    ).toBeNull();
  });
});
