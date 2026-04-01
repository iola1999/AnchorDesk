import { describe, expect, test } from "vitest";

import {
  appendStreamingAssistantThinkingProcessStep,
  STREAMING_ASSISTANT_LEASE_TIMEOUT_MS,
  buildInitialStreamingAssistantRunState,
  finalizeStreamingAssistantRunState,
  buildStreamingAssistantRunState,
  closeStreamingAssistantThinkingProcessSteps,
  isStreamingAssistantRunExpired,
  readStreamingAssistantProcessSteps,
  readStreamingAssistantRunState,
  refreshStreamingAssistantRunState,
  updateStreamingAssistantRunState,
  upsertStreamingAssistantToolProcessStep,
} from "./conversation-run";
import { ASSISTANT_STREAM_PHASE } from "./domain";

describe("buildStreamingAssistantRunState", () => {
  test("builds a normalized lease window from the provided clock", () => {
    const now = new Date("2026-03-30T10:00:00.000Z");

    expect(buildStreamingAssistantRunState({ now, runId: "run-1" })).toEqual({
      run_id: "run-1",
      run_started_at: "2026-03-30T10:00:00.000Z",
      run_last_heartbeat_at: "2026-03-30T10:00:00.000Z",
      run_lease_expires_at: new Date(
        now.getTime() + STREAMING_ASSISTANT_LEASE_TIMEOUT_MS,
      ).toISOString(),
      phase: null,
      status_text: null,
      stream_event_id: null,
      active_tool_name: null,
      active_tool_use_id: null,
      active_task_id: null,
      thinking_text: null,
      process_steps: [],
    });
  });
});

describe("readStreamingAssistantRunState", () => {
  test("returns null for malformed state", () => {
    expect(readStreamingAssistantRunState(null)).toBeNull();
    expect(
      readStreamingAssistantRunState({
        run_id: "run-1",
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
        run_id: "run-1",
        run_started_at: "2026-03-30T10:00:00.000Z",
        run_last_heartbeat_at: "2026-03-30T10:00:10.000Z",
        run_lease_expires_at: "2026-03-30T10:00:55.000Z",
      },
      new Date("2026-03-30T10:00:20.000Z"),
    );

    expect(refreshed).toEqual({
      run_id: "run-1",
      run_started_at: "2026-03-30T10:00:00.000Z",
      run_last_heartbeat_at: "2026-03-30T10:00:20.000Z",
      run_lease_expires_at: "2026-03-30T10:01:05.000Z",
      phase: null,
      status_text: null,
      stream_event_id: null,
      active_tool_name: null,
      active_tool_use_id: null,
      active_task_id: null,
      thinking_text: null,
      process_steps: [],
    });
  });
});

describe("updateStreamingAssistantRunState", () => {
  test("preserves the lease window while merging live runtime metadata", () => {
    expect(
      updateStreamingAssistantRunState(
        {
          run_id: "run-1",
          run_started_at: "2026-03-30T10:00:00.000Z",
          run_last_heartbeat_at: "2026-03-30T10:00:10.000Z",
          run_lease_expires_at: "2026-03-30T10:00:55.000Z",
          phase: ASSISTANT_STREAM_PHASE.TOOL,
          status_text: "正在调用工具...",
          stream_event_id: "1743328800000-0",
          active_tool_name: "fetch_source",
          active_tool_use_id: "tool-1",
          thinking_text: "先搜索本地资料",
        },
        {
          now: new Date("2026-03-30T10:00:20.000Z"),
          phase: ASSISTANT_STREAM_PHASE.FINALIZING,
          statusText: "正在整理证据并生成最终答案...",
          streamEventId: "1743328801000-0",
          activeToolName: null,
          activeToolUseId: null,
        },
      ),
    ).toEqual({
      run_id: "run-1",
      run_started_at: "2026-03-30T10:00:00.000Z",
      run_last_heartbeat_at: "2026-03-30T10:00:20.000Z",
      run_lease_expires_at: "2026-03-30T10:01:05.000Z",
      phase: ASSISTANT_STREAM_PHASE.FINALIZING,
      status_text: "正在整理证据并生成最终答案...",
      stream_event_id: "1743328801000-0",
      active_tool_name: null,
      active_tool_use_id: null,
      active_task_id: null,
      thinking_text: "先搜索本地资料",
      process_steps: [],
    });
  });
});

describe("buildInitialStreamingAssistantRunState", () => {
  test("starts the streaming assistant in analyzing phase with visible status copy", () => {
    expect(
      buildInitialStreamingAssistantRunState({
        now: new Date("2026-03-30T10:00:00.000Z"),
        runId: "run-1",
      }),
    ).toEqual({
      run_id: "run-1",
      run_started_at: "2026-03-30T10:00:00.000Z",
      run_last_heartbeat_at: "2026-03-30T10:00:00.000Z",
      run_lease_expires_at: "2026-03-30T10:00:45.000Z",
      phase: ASSISTANT_STREAM_PHASE.ANALYZING,
      status_text: "助手正在分析问题并准备回答...",
      stream_event_id: null,
      active_tool_name: null,
      active_tool_use_id: null,
      active_task_id: null,
      thinking_text: null,
      process_steps: [],
    });
  });
});

describe("finalizeStreamingAssistantRunState", () => {
  test("preserves run identity while clearing live-only status fields", () => {
    expect(
      finalizeStreamingAssistantRunState(
        {
          run_id: "run-1",
          run_started_at: "2026-03-30T10:00:00.000Z",
          run_last_heartbeat_at: "2026-03-30T10:00:10.000Z",
          run_lease_expires_at: "2026-03-30T10:00:55.000Z",
          phase: ASSISTANT_STREAM_PHASE.TOOL,
          status_text: "正在调用工具...",
          stream_event_id: "1743328800000-0",
          active_tool_name: "fetch_source",
          active_tool_use_id: "tool-1",
          active_task_id: "task-1",
          thinking_text: "先确认工具是否可用",
        },
        {
          now: new Date("2026-03-30T10:00:20.000Z"),
          streamEventId: "1743328802000-0",
        },
      ),
    ).toEqual({
      run_id: "run-1",
      run_started_at: "2026-03-30T10:00:00.000Z",
      run_last_heartbeat_at: "2026-03-30T10:00:20.000Z",
      run_lease_expires_at: "2026-03-30T10:01:05.000Z",
      phase: null,
      status_text: null,
      stream_event_id: "1743328802000-0",
      active_tool_name: null,
      active_tool_use_id: null,
      active_task_id: null,
      thinking_text: "先确认工具是否可用",
      process_steps: [],
    });
  });
});

describe("streaming assistant process steps", () => {
  test("appends thinking into one step until a tool boundary starts a new segment", () => {
    const firstThinking = appendStreamingAssistantThinkingProcessStep([], {
      now: new Date("2026-04-02T10:00:00.000Z"),
      fullText: "先确认本地资料",
    });
    const withTool = upsertStreamingAssistantToolProcessStep(firstThinking, {
      stepId: "tool-1",
      status: "streaming",
      now: new Date("2026-04-02T10:00:01.000Z"),
      toolName: "search_workspace_knowledge",
      toolUseId: "tool-1",
      toolMessageId: "tool-message-1",
    });
    const secondThinking = appendStreamingAssistantThinkingProcessStep(withTool, {
      now: new Date("2026-04-02T10:00:02.000Z"),
      fullText: "先确认本地资料再决定是否联网",
    });

    expect(secondThinking).toEqual([
      {
        id: expect.any(String),
        kind: "thinking",
        status: "completed",
        created_at: "2026-04-02T10:00:00.000Z",
        updated_at: "2026-04-02T10:00:01.000Z",
        completed_at: "2026-04-02T10:00:01.000Z",
        text: "先确认本地资料",
      },
      {
        id: "tool-1",
        kind: "tool",
        status: "streaming",
        created_at: "2026-04-02T10:00:01.000Z",
        updated_at: "2026-04-02T10:00:01.000Z",
        completed_at: null,
        tool_name: "search_workspace_knowledge",
        tool_use_id: "tool-1",
        tool_message_id: "tool-message-1",
      },
      {
        id: expect.any(String),
        kind: "thinking",
        status: "streaming",
        created_at: "2026-04-02T10:00:02.000Z",
        updated_at: "2026-04-02T10:00:02.000Z",
        completed_at: null,
        text: "再决定是否联网",
      },
    ]);
  });

  test("reads persisted process steps from structured state", () => {
    expect(
      readStreamingAssistantProcessSteps({
        process_steps: [
          {
            id: "thinking-1",
            kind: "thinking",
            status: "completed",
            created_at: "2026-04-02T10:00:00.000Z",
            updated_at: "2026-04-02T10:00:01.000Z",
            completed_at: "2026-04-02T10:00:01.000Z",
            text: "先确认工具是否可用",
          },
        ],
      }),
    ).toEqual([
      {
        id: "thinking-1",
        kind: "thinking",
        status: "completed",
        created_at: "2026-04-02T10:00:00.000Z",
        updated_at: "2026-04-02T10:00:01.000Z",
        completed_at: "2026-04-02T10:00:01.000Z",
        text: "先确认工具是否可用",
      },
    ]);
  });

  test("closes active thinking steps when drafting starts", () => {
    expect(
      closeStreamingAssistantThinkingProcessSteps(
        [
          {
            id: "thinking-1",
            kind: "thinking",
            status: "streaming",
            created_at: "2026-04-02T10:00:00.000Z",
            updated_at: "2026-04-02T10:00:00.000Z",
            completed_at: null,
            text: "先整理上下文",
          },
        ],
        new Date("2026-04-02T10:00:01.000Z"),
      ),
    ).toEqual([
      {
        id: "thinking-1",
        kind: "thinking",
        status: "completed",
        created_at: "2026-04-02T10:00:00.000Z",
        updated_at: "2026-04-02T10:00:01.000Z",
        completed_at: "2026-04-02T10:00:01.000Z",
        text: "先整理上下文",
      },
    ]);
  });
});

describe("isStreamingAssistantRunExpired", () => {
  test("uses lease expiry when structured state is present", () => {
    expect(
      isStreamingAssistantRunExpired({
        structuredJson: {
          run_id: "run-1",
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
