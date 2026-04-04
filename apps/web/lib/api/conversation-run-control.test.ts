import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestAgentRuntimeCancel: vi.fn(),
}));

vi.mock("./agent-runtime", () => ({
  requestAgentRuntimeCancel: mocks.requestAgentRuntimeCancel,
}));

let cancelStreamingAssistantRun: typeof import("./conversation-run-control").cancelStreamingAssistantRun;

beforeEach(async () => {
  mocks.requestAgentRuntimeCancel.mockReset();
  ({ cancelStreamingAssistantRun } = await import("./conversation-run-control"));
});

describe("cancelStreamingAssistantRun", () => {
  test("requests runtime cancellation when a run id is present", async () => {
    mocks.requestAgentRuntimeCancel.mockResolvedValue({ ok: true, cancelled: true });

    await expect(
      cancelStreamingAssistantRun({
        conversationId: "conversation-1",
        assistantMessageId: "assistant-1",
        runId: "run-1",
        reason: "stale_stream_expired",
      }),
    ).resolves.toBe(true);

    expect(mocks.requestAgentRuntimeCancel).toHaveBeenCalledWith({
      assistantMessageId: "assistant-1",
      runId: "run-1",
      reason: "stale_stream_expired",
    });
  });

  test("skips runtime cancellation when the run id is missing", async () => {
    await expect(
      cancelStreamingAssistantRun({
        conversationId: "conversation-1",
        assistantMessageId: "assistant-1",
        runId: null,
        reason: "user_stop",
      }),
    ).resolves.toBe(false);

    expect(mocks.requestAgentRuntimeCancel).not.toHaveBeenCalled();
  });
});
