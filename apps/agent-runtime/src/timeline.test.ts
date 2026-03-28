import { describe, expect, it } from "vitest";

import { buildToolTimelineMessage } from "./timeline";

describe("buildToolTimelineMessage", () => {
  it("builds started messages for tool timeline", () => {
    expect(
      buildToolTimelineMessage({
        toolName: "mcp__assistant__search_workspace_knowledge",
        state: "started",
      }),
    ).toEqual({
      contentMarkdown: "开始调用工具：search_workspace_knowledge",
      structuredJson: {
        timeline_event: "tool_started",
        tool_name: "search_workspace_knowledge",
      },
      status: "streaming",
    });
  });

  it("builds failed messages with error details", () => {
    expect(
      buildToolTimelineMessage({
        toolName: "search_web_general",
        state: "failed",
        error: "provider unavailable",
      }),
    ).toEqual({
      contentMarkdown: "工具执行失败：search_web_general · provider unavailable",
      structuredJson: {
        timeline_event: "tool_failed",
        tool_name: "search_web_general",
        error: "provider unavailable",
      },
      status: "failed",
    });
  });

  it("builds completed messages for finished tools", () => {
    expect(
      buildToolTimelineMessage({
        toolName: "assistant__read_citation_anchor",
        state: "completed",
      }),
    ).toEqual({
      contentMarkdown: "工具执行完成：read_citation_anchor",
      structuredJson: {
        timeline_event: "tool_finished",
        tool_name: "read_citation_anchor",
      },
      status: "completed",
    });
  });
});
