import {
  ASSISTANT_STREAM_PHASE,
  ASSISTANT_STREAM_PHASE_VALUES,
  MESSAGE_STATUS,
  MESSAGE_STATUS_VALUES,
  type AssistantStreamPhase,
  type MessageStatus,
} from "./domain";

export const STREAMING_ASSISTANT_HEARTBEAT_INTERVAL_MS = 10_000;
export const STREAMING_ASSISTANT_LEASE_TIMEOUT_MS = 45_000;

type ValueOf<T> = T[keyof T];

export const STREAMING_ASSISTANT_PROCESS_STEP_KIND = {
  THINKING: "thinking",
  TOOL: "tool",
} as const;
export type StreamingAssistantProcessStepKind = ValueOf<
  typeof STREAMING_ASSISTANT_PROCESS_STEP_KIND
>;

export type StreamingAssistantThinkingProcessStep = {
  id: string;
  kind: typeof STREAMING_ASSISTANT_PROCESS_STEP_KIND.THINKING;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  text: string;
};

export type StreamingAssistantToolProcessStep = {
  id: string;
  kind: typeof STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  tool_name: string | null;
  tool_use_id: string | null;
  tool_message_id: string | null;
};

export type StreamingAssistantProcessStep =
  | StreamingAssistantThinkingProcessStep
  | StreamingAssistantToolProcessStep;

export type StreamingAssistantRunState = {
  run_id: string;
  run_started_at: string;
  run_last_heartbeat_at: string;
  run_lease_expires_at: string;
  phase?: AssistantStreamPhase | null;
  status_text?: string | null;
  stream_event_id?: string | null;
  active_tool_name?: string | null;
  active_tool_use_id?: string | null;
  active_task_id?: string | null;
  thinking_text?: string | null;
  process_steps: StreamingAssistantProcessStep[];
};

function asValidDate(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function buildStreamingAssistantRunId() {
  if (
    typeof globalThis.crypto === "object" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildStreamingAssistantProcessStepId(prefix: string) {
  if (
    typeof globalThis.crypto === "object" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readMessageStatus(value: unknown) {
  return typeof value === "string" && MESSAGE_STATUS_VALUES.includes(value as MessageStatus)
    ? (value as MessageStatus)
    : null;
}

function normalizeProcessStep(
  value: unknown,
): StreamingAssistantProcessStep | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const step = value as Record<string, unknown>;
  const id = typeof step.id === "string" && step.id.trim() ? step.id.trim() : null;
  const kind =
    typeof step.kind === "string" &&
    (step.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.THINKING ||
      step.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL)
      ? (step.kind as StreamingAssistantProcessStepKind)
      : null;
  const status = readMessageStatus(step.status);
  const createdAt = asValidDate(step.created_at);
  const updatedAt = asValidDate(step.updated_at);
  const completedAt = asValidDate(step.completed_at);

  if (!id || !kind || !status || !createdAt || !updatedAt) {
    return null;
  }

  if (kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.THINKING) {
    const text = typeof step.text === "string" ? step.text : "";
    if (!text) {
      return null;
    }

    return {
      id,
      kind,
      status,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
      completed_at: completedAt?.toISOString() ?? null,
      text,
    };
  }

  return {
    id,
    kind,
    status,
    created_at: createdAt.toISOString(),
    updated_at: updatedAt.toISOString(),
    completed_at: completedAt?.toISOString() ?? null,
    tool_name: typeof step.tool_name === "string" ? step.tool_name : null,
    tool_use_id: typeof step.tool_use_id === "string" ? step.tool_use_id : null,
    tool_message_id:
      typeof step.tool_message_id === "string" ? step.tool_message_id : null,
  };
}

export function readStreamingAssistantProcessSteps(
  structuredJson: Record<string, unknown> | null | undefined,
) {
  const rawSteps = structuredJson?.process_steps;
  if (!Array.isArray(rawSteps)) {
    return [];
  }

  return rawSteps
    .map((step) => normalizeProcessStep(step))
    .filter((step): step is StreamingAssistantProcessStep => step !== null);
}

function joinThinkingStepText(steps: StreamingAssistantProcessStep[]) {
  return steps
    .filter(
      (step): step is StreamingAssistantThinkingProcessStep =>
        step.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.THINKING,
    )
    .map((step) => step.text)
    .join("");
}

function deriveThinkingStepDelta(input: {
  deltaText?: string | null;
  fullText?: string | null;
  steps: StreamingAssistantProcessStep[];
}) {
  if (typeof input.deltaText === "string" && input.deltaText.length > 0) {
    return input.deltaText;
  }

  if (typeof input.fullText !== "string" || input.fullText.length === 0) {
    return null;
  }

  const previousText = joinThinkingStepText(input.steps);
  return input.fullText.startsWith(previousText)
    ? input.fullText.slice(previousText.length)
    : input.fullText;
}

export function closeStreamingAssistantThinkingProcessSteps(
  steps: StreamingAssistantProcessStep[],
  now: Date = new Date(),
) {
  const timestamp = now.toISOString();
  let changed = false;
  const nextSteps = steps.map((step) => {
    if (
      step.kind !== STREAMING_ASSISTANT_PROCESS_STEP_KIND.THINKING ||
      step.status !== MESSAGE_STATUS.STREAMING
    ) {
      return step;
    }

    changed = true;
    return {
      ...step,
      status: MESSAGE_STATUS.COMPLETED,
      updated_at: timestamp,
      completed_at: step.completed_at ?? timestamp,
    };
  });

  return changed ? nextSteps : steps;
}

export function appendStreamingAssistantThinkingProcessStep(
  steps: StreamingAssistantProcessStep[],
  input: {
    now?: Date;
    deltaText?: string | null;
    fullText?: string | null;
  },
) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const deltaText = deriveThinkingStepDelta({
    deltaText: input.deltaText,
    fullText: input.fullText,
    steps,
  });

  if (!deltaText) {
    return steps;
  }

  const lastStep = steps[steps.length - 1];
  if (
    lastStep?.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.THINKING &&
    lastStep.status === MESSAGE_STATUS.STREAMING
  ) {
    return steps.map((step, index) =>
      index === steps.length - 1
        ? {
            ...step,
            text: `${lastStep.text}${deltaText}`,
            updated_at: timestamp,
          }
        : step,
    );
  }

  const nextSteps = closeStreamingAssistantThinkingProcessSteps(steps, now);
  return [
    ...nextSteps,
    {
      id: buildStreamingAssistantProcessStepId("thinking"),
      kind: STREAMING_ASSISTANT_PROCESS_STEP_KIND.THINKING,
      status: MESSAGE_STATUS.STREAMING,
      created_at: timestamp,
      updated_at: timestamp,
      completed_at: null,
      text: deltaText,
    },
  ];
}

function findOpenToolProcessStepIndex(input: {
  stepId: string;
  steps: StreamingAssistantProcessStep[];
  toolName?: string | null;
  toolUseId?: string | null;
}) {
  const byIdIndex = input.steps.findIndex(
    (step) =>
      step.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL &&
      step.id === input.stepId,
  );
  if (byIdIndex >= 0) {
    return byIdIndex;
  }

  if (input.toolUseId) {
    const byUseIdIndex = input.steps.findIndex(
      (step) =>
        step.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL &&
        step.tool_use_id === input.toolUseId,
    );
    if (byUseIdIndex >= 0) {
      return byUseIdIndex;
    }
  }

  if (!input.toolName) {
    return -1;
  }

  for (let index = input.steps.length - 1; index >= 0; index -= 1) {
    const step = input.steps[index];
    if (
      step?.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL &&
      step.tool_name === input.toolName &&
      step.status === MESSAGE_STATUS.STREAMING &&
      step.completed_at === null
    ) {
      return index;
    }
  }

  return -1;
}

export function upsertStreamingAssistantToolProcessStep(
  steps: StreamingAssistantProcessStep[],
  input: {
    stepId: string;
    status: MessageStatus;
    now?: Date;
    toolName?: string | null;
    toolUseId?: string | null;
    toolMessageId?: string | null;
  },
) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const nextSteps = closeStreamingAssistantThinkingProcessSteps(steps, now);
  const existingIndex = findOpenToolProcessStepIndex({
    stepId: input.stepId,
    steps: nextSteps,
    toolName: input.toolName ?? null,
    toolUseId: input.toolUseId ?? null,
  });

  if (existingIndex >= 0) {
    return nextSteps.map((step, index) => {
      if (index !== existingIndex) {
        return step;
      }

      return {
        ...step,
        status: input.status,
        updated_at: timestamp,
        completed_at:
          input.status === MESSAGE_STATUS.STREAMING
            ? null
            : step.completed_at ?? timestamp,
        tool_name:
          step.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL
            ? input.toolName ?? step.tool_name
            : input.toolName ?? null,
        tool_use_id:
          step.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL
            ? input.toolUseId ?? step.tool_use_id
            : input.toolUseId ?? null,
        tool_message_id:
          step.kind === STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL
            ? input.toolMessageId ?? step.tool_message_id
            : input.toolMessageId ?? null,
      };
    });
  }

  return [
    ...nextSteps,
    {
      id: input.stepId,
      kind: STREAMING_ASSISTANT_PROCESS_STEP_KIND.TOOL,
      status: input.status,
      created_at: timestamp,
      updated_at: timestamp,
      completed_at: input.status === MESSAGE_STATUS.STREAMING ? null : timestamp,
      tool_name: input.toolName ?? null,
      tool_use_id: input.toolUseId ?? null,
      tool_message_id: input.toolMessageId ?? null,
    },
  ];
}

export function readStreamingAssistantRunState(
  structuredJson: Record<string, unknown> | null | undefined,
): StreamingAssistantRunState | null {
  if (!structuredJson) {
    return null;
  }

  const runId =
    typeof structuredJson.run_id === "string" && structuredJson.run_id.trim()
      ? structuredJson.run_id.trim()
      : null;
  const startedAt = asValidDate(structuredJson.run_started_at);
  const lastHeartbeatAt = asValidDate(structuredJson.run_last_heartbeat_at);
  const leaseExpiresAt = asValidDate(structuredJson.run_lease_expires_at);

  if (!runId || !startedAt || !lastHeartbeatAt || !leaseExpiresAt) {
    return null;
  }

  const phase =
    typeof structuredJson.phase === "string" &&
    ASSISTANT_STREAM_PHASE_VALUES.includes(
      structuredJson.phase as AssistantStreamPhase,
    )
      ? (structuredJson.phase as AssistantStreamPhase)
      : null;
  const statusText =
    typeof structuredJson.status_text === "string" ? structuredJson.status_text : null;
  const streamEventId =
    typeof structuredJson.stream_event_id === "string"
      ? structuredJson.stream_event_id
      : null;
  const activeToolName =
    typeof structuredJson.active_tool_name === "string"
      ? structuredJson.active_tool_name
      : null;
  const activeToolUseId =
    typeof structuredJson.active_tool_use_id === "string"
      ? structuredJson.active_tool_use_id
      : null;
  const activeTaskId =
    typeof structuredJson.active_task_id === "string"
      ? structuredJson.active_task_id
      : null;
  const thinkingText =
    typeof structuredJson.thinking_text === "string"
      ? structuredJson.thinking_text
      : null;
  const processSteps = readStreamingAssistantProcessSteps(structuredJson);

  return {
    run_id: runId,
    run_started_at: startedAt.toISOString(),
    run_last_heartbeat_at: lastHeartbeatAt.toISOString(),
    run_lease_expires_at: leaseExpiresAt.toISOString(),
    phase,
    status_text: statusText,
    stream_event_id: streamEventId,
    active_tool_name: activeToolName,
    active_tool_use_id: activeToolUseId,
    active_task_id: activeTaskId,
    thinking_text: thinkingText,
    process_steps: processSteps,
  };
}

export function buildStreamingAssistantRunState(input: {
  now?: Date;
  runId?: string | null;
  startedAt?: Date | string;
  phase?: AssistantStreamPhase | null;
  statusText?: string | null;
  streamEventId?: string | null;
  activeToolName?: string | null;
  activeToolUseId?: string | null;
  activeTaskId?: string | null;
  thinkingText?: string | null;
  processSteps?: StreamingAssistantProcessStep[] | null;
} = {}): StreamingAssistantRunState {
  const now = input.now ?? new Date();
  const startedAt = asValidDate(input.startedAt) ?? now;

  return {
    run_id: input.runId?.trim() || buildStreamingAssistantRunId(),
    run_started_at: startedAt.toISOString(),
    run_last_heartbeat_at: now.toISOString(),
    run_lease_expires_at: new Date(
      now.getTime() + STREAMING_ASSISTANT_LEASE_TIMEOUT_MS,
    ).toISOString(),
    phase: input.phase ?? null,
    status_text: input.statusText ?? null,
    stream_event_id: input.streamEventId ?? null,
    active_tool_name: input.activeToolName ?? null,
    active_tool_use_id: input.activeToolUseId ?? null,
    active_task_id: input.activeTaskId ?? null,
    thinking_text: input.thinkingText ?? null,
    process_steps: Array.isArray(input.processSteps) ? input.processSteps : [],
  };
}

export function refreshStreamingAssistantRunState(
  structuredJson: Record<string, unknown> | null | undefined,
  now: Date = new Date(),
): StreamingAssistantRunState {
  const existing = readStreamingAssistantRunState(structuredJson);

  return buildStreamingAssistantRunState({
    now,
    runId: existing?.run_id ?? null,
    startedAt: existing?.run_started_at ?? now,
    phase: existing?.phase ?? null,
    statusText: existing?.status_text ?? null,
    streamEventId: existing?.stream_event_id ?? null,
    activeToolName: existing?.active_tool_name ?? null,
    activeToolUseId: existing?.active_tool_use_id ?? null,
    activeTaskId: existing?.active_task_id ?? null,
    thinkingText: existing?.thinking_text ?? null,
    processSteps: existing?.process_steps ?? [],
  });
}

export function updateStreamingAssistantRunState(
  structuredJson: Record<string, unknown> | null | undefined,
  patch: {
    now?: Date;
    phase?: AssistantStreamPhase | null;
    statusText?: string | null;
    streamEventId?: string | null;
    activeToolName?: string | null;
    activeToolUseId?: string | null;
    activeTaskId?: string | null;
    thinkingText?: string | null;
    processSteps?: StreamingAssistantProcessStep[] | null;
  },
) {
  const existing = refreshStreamingAssistantRunState(
    structuredJson,
    patch.now ?? new Date(),
  );

  return buildStreamingAssistantRunState({
    now: patch.now ?? new Date(),
    runId: existing.run_id,
    startedAt: existing.run_started_at,
    phase: patch.phase === undefined ? existing.phase ?? null : patch.phase,
    statusText:
      patch.statusText === undefined ? existing.status_text ?? null : patch.statusText,
    streamEventId:
      patch.streamEventId === undefined
        ? existing.stream_event_id ?? null
        : patch.streamEventId,
    activeToolName:
      patch.activeToolName === undefined
        ? existing.active_tool_name ?? null
        : patch.activeToolName,
    activeToolUseId:
      patch.activeToolUseId === undefined
        ? existing.active_tool_use_id ?? null
        : patch.activeToolUseId,
    activeTaskId:
      patch.activeTaskId === undefined
        ? existing.active_task_id ?? null
        : patch.activeTaskId,
    thinkingText:
      patch.thinkingText === undefined
        ? existing.thinking_text ?? null
        : patch.thinkingText,
    processSteps:
      patch.processSteps === undefined
        ? existing.process_steps ?? []
        : patch.processSteps ?? [],
  });
}

export function buildInitialStreamingAssistantRunState(input: {
  now?: Date;
  runId?: string | null;
  startedAt?: Date | string;
  statusText?: string | null;
} = {}) {
  return buildStreamingAssistantRunState({
    now: input.now,
    runId: input.runId ?? null,
    startedAt: input.startedAt,
    phase: ASSISTANT_STREAM_PHASE.ANALYZING,
    statusText: input.statusText ?? "助手正在分析问题并准备回答...",
  });
}

export function finalizeStreamingAssistantRunState(
  structuredJson: Record<string, unknown> | null | undefined,
  input: {
    now?: Date;
    streamEventId?: string | null;
  } = {},
) {
  const now = input.now ?? new Date();
  const existing = refreshStreamingAssistantRunState(structuredJson, now);

  return buildStreamingAssistantRunState({
    now,
    runId: existing.run_id,
    startedAt: existing.run_started_at,
    phase: null,
    statusText: null,
    streamEventId:
      input.streamEventId === undefined ? existing.stream_event_id ?? null : input.streamEventId,
    activeToolName: null,
    activeToolUseId: null,
    activeTaskId: null,
    thinkingText: existing.thinking_text ?? null,
    processSteps: closeStreamingAssistantThinkingProcessSteps(
      existing.process_steps ?? [],
      now,
    ),
  });
}

export function isStreamingAssistantRunExpired(input: {
  structuredJson?: Record<string, unknown> | null;
  createdAt?: Date | string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const state = readStreamingAssistantRunState(input.structuredJson ?? null);

  if (state) {
    return new Date(state.run_lease_expires_at).getTime() <= now.getTime();
  }

  const createdAt = asValidDate(input.createdAt ?? null);
  if (!createdAt) {
    return false;
  }

  return (
    createdAt.getTime() + STREAMING_ASSISTANT_LEASE_TIMEOUT_MS <= now.getTime()
  );
}
