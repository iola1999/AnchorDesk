export type ToolTimelineState = "started" | "completed" | "failed";

function normalizeToolName(toolName: string) {
  return toolName
    .replace(/^mcp__assistant__/, "")
    .replace(/^assistant__/, "")
    .trim();
}

export function buildToolTimelineMessage(input: {
  toolName: string;
  state: ToolTimelineState;
  error?: string | null;
}) {
  const toolName = normalizeToolName(input.toolName);

  if (input.state === "started") {
    return {
      contentMarkdown: `开始调用工具：${toolName}`,
      structuredJson: {
        timeline_event: "tool_started",
        tool_name: toolName,
      },
      status: "streaming" as const,
    };
  }

  if (input.state === "failed") {
    return {
      contentMarkdown: `工具执行失败：${toolName}${input.error ? ` · ${input.error}` : ""}`,
      structuredJson: {
        timeline_event: "tool_failed",
        tool_name: toolName,
        error: input.error ?? null,
      },
      status: "failed" as const,
    };
  }

  return {
    contentMarkdown: `工具执行完成：${toolName}`,
    structuredJson: {
      timeline_event: "tool_finished",
      tool_name: toolName,
    },
    status: "completed" as const,
  };
}

