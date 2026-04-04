import { describe, expect, test, vi } from "vitest";

import {
  cancelActiveConversationRun,
  registerActiveConversationRun,
} from "./active-conversation-runs";

describe("cancelActiveConversationRun", () => {
  test("invokes the registered cancel handler for the matching run", async () => {
    const cancel = vi.fn(async () => undefined);
    const unregister = registerActiveConversationRun({
      conversationId: "conversation-1",
      assistantMessageId: "assistant-1",
      runId: "run-1",
      cancel,
    });

    await expect(
      cancelActiveConversationRun({
        assistantMessageId: "assistant-1",
        runId: "run-1",
        reason: "user_stop",
      }),
    ).resolves.toBe(true);

    expect(cancel).toHaveBeenCalledWith("user_stop");
    unregister();
  });

  test("returns false when the run is not registered", async () => {
    await expect(
      cancelActiveConversationRun({
        assistantMessageId: "assistant-missing",
        runId: "run-missing",
        reason: "user_stop",
      }),
    ).resolves.toBe(false);
  });
});
