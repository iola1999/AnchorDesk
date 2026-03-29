import { describe, expect, test } from "vitest";

import {
  STREAMING_ASSISTANT_LEASE_TIMEOUT_MS,
  buildStreamingAssistantRunState,
  isStreamingAssistantRunExpired,
  readStreamingAssistantRunState,
  refreshStreamingAssistantRunState,
} from "./conversation-run";

describe("buildStreamingAssistantRunState", () => {
  test("builds a normalized lease window from the provided clock", () => {
    const now = new Date("2026-03-30T10:00:00.000Z");

    expect(buildStreamingAssistantRunState({ now })).toEqual({
      run_started_at: "2026-03-30T10:00:00.000Z",
      run_last_heartbeat_at: "2026-03-30T10:00:00.000Z",
      run_lease_expires_at: new Date(
        now.getTime() + STREAMING_ASSISTANT_LEASE_TIMEOUT_MS,
      ).toISOString(),
    });
  });
});

describe("readStreamingAssistantRunState", () => {
  test("returns null for malformed state", () => {
    expect(readStreamingAssistantRunState(null)).toBeNull();
    expect(
      readStreamingAssistantRunState({
        run_started_at: "bad-date",
        run_last_heartbeat_at: "2026-03-30T10:00:00.000Z",
        run_lease_expires_at: "2026-03-30T10:00:45.000Z",
      }),
    ).toBeNull();
  });
});

describe("refreshStreamingAssistantRunState", () => {
  test("keeps the original started_at while moving the heartbeat window forward", () => {
    const refreshed = refreshStreamingAssistantRunState(
      {
        run_started_at: "2026-03-30T10:00:00.000Z",
        run_last_heartbeat_at: "2026-03-30T10:00:10.000Z",
        run_lease_expires_at: "2026-03-30T10:00:55.000Z",
      },
      new Date("2026-03-30T10:00:20.000Z"),
    );

    expect(refreshed).toEqual({
      run_started_at: "2026-03-30T10:00:00.000Z",
      run_last_heartbeat_at: "2026-03-30T10:00:20.000Z",
      run_lease_expires_at: "2026-03-30T10:01:05.000Z",
    });
  });
});

describe("isStreamingAssistantRunExpired", () => {
  test("uses lease expiry when structured state is present", () => {
    expect(
      isStreamingAssistantRunExpired({
        structuredJson: {
          run_started_at: "2026-03-30T10:00:00.000Z",
          run_last_heartbeat_at: "2026-03-30T10:00:10.000Z",
          run_lease_expires_at: "2026-03-30T10:00:45.000Z",
        },
        now: new Date("2026-03-30T10:00:46.000Z"),
      }),
    ).toBe(true);
  });

  test("falls back to message creation time for legacy streaming rows", () => {
    expect(
      isStreamingAssistantRunExpired({
        structuredJson: null,
        createdAt: "2026-03-30T10:00:00.000Z",
        now: new Date("2026-03-30T10:00:46.000Z"),
      }),
    ).toBe(true);
    expect(
      isStreamingAssistantRunExpired({
        structuredJson: null,
        createdAt: "2026-03-30T10:00:00.000Z",
        now: new Date("2026-03-30T10:00:20.000Z"),
      }),
    ).toBe(false);
  });
});
