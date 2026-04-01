import { ASSISTANT_STREAM_PHASE, type AssistantStreamPhase } from "@anchordesk/contracts";

export function extractAssistantTextDelta(message: unknown) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const streamMessage = message as {
    type?: string;
    event?: {
      type?: string;
      delta?: {
        type?: string;
        text?: string;
      };
    };
  };

  if (
    streamMessage.type !== "stream_event" ||
    streamMessage.event?.type !== "content_block_delta" ||
    streamMessage.event.delta?.type !== "text_delta"
  ) {
    return null;
  }

  return typeof streamMessage.event.delta.text === "string"
    ? streamMessage.event.delta.text
    : null;
}

export function extractAssistantThinkingDelta(message: unknown) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const streamMessage = message as {
    type?: string;
    event?: {
      type?: string;
      delta?: {
        type?: string;
        thinking?: string;
      };
    };
  };

  if (
    streamMessage.type !== "stream_event" ||
    streamMessage.event?.type !== "content_block_delta" ||
    streamMessage.event.delta?.type !== "thinking_delta"
  ) {
    return null;
  }

  return typeof streamMessage.event.delta.thinking === "string"
    ? streamMessage.event.delta.thinking
    : null;
}

export type AssistantRuntimeSignal =
  | {
      kind: "assistant_status";
      phase: AssistantStreamPhase;
      statusText: string;
      toolName?: string | null;
      toolUseId?: string | null;
      taskId?: string | null;
    }
  | {
      kind: "tool_progress";
      toolName: string;
      toolUseId: string;
      elapsedSeconds: number;
      statusText: string;
      taskId?: string | null;
    };

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractAssistantRuntimeSignal(
  message: unknown,
): AssistantRuntimeSignal | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const value = message as {
    type?: string;
    subtype?: string;
    status?: string | null;
    description?: string;
    tool_use_id?: string;
    tool_name?: string;
    last_tool_name?: string;
    elapsed_time_seconds?: number;
    task_id?: string;
  };

  if (value.type === "tool_progress") {
    const toolUseId = readNonEmptyString(value.tool_use_id);
    const toolName = readNonEmptyString(value.tool_name);
    const elapsedSeconds =
      typeof value.elapsed_time_seconds === "number" &&
      Number.isFinite(value.elapsed_time_seconds)
        ? Math.max(0, Math.floor(value.elapsed_time_seconds))
        : 0;

    if (!toolUseId || !toolName) {
      return null;
    }

    return {
      kind: "tool_progress",
      toolUseId,
      toolName,
      elapsedSeconds,
      statusText: `正在调用工具 ${toolName} · ${elapsedSeconds}s`,
      taskId: readNonEmptyString(value.task_id),
    };
  }

  if (value.type === "system" && value.subtype === "status") {
    if (value.status === "compacting") {
      return {
        kind: "assistant_status",
        phase: ASSISTANT_STREAM_PHASE.ANALYZING,
        statusText: "正在整理上下文并压缩历史...",
      };
    }

    return null;
  }

  if (
    value.type === "system" &&
    (value.subtype === "task_started" || value.subtype === "task_progress")
  ) {
    const description = readNonEmptyString(value.description);
    const toolUseId = readNonEmptyString(value.tool_use_id);
    const toolName = readNonEmptyString(value.last_tool_name) ?? readNonEmptyString(value.tool_name);

    if (!description) {
      return null;
    }

    return {
      kind: "assistant_status",
      phase: toolUseId ? ASSISTANT_STREAM_PHASE.TOOL : ASSISTANT_STREAM_PHASE.ANALYZING,
      statusText: description,
      toolUseId,
      toolName,
      taskId: readNonEmptyString(value.task_id),
    };
  }

  return null;
}
