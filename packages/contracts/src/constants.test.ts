import { describe, expect, test } from "vitest";

import {
  ASSISTANT_MCP_TOOL,
  ASSISTANT_TOOL,
  DEFAULT_WORKSPACE_MODE,
  KB_ONLY_ALLOWED_TOOL_NAMES,
  KB_PLUS_WEB_ALLOWED_TOOL_NAMES,
  WORKSPACE_MODE,
  normalizeAssistantToolName,
  normalizeWorkspaceMode,
} from "./constants";

describe("shared constants helpers", () => {
  test("normalizes workspace mode to a supported default", () => {
    expect(normalizeWorkspaceMode(WORKSPACE_MODE.KB_PLUS_WEB)).toBe(
      WORKSPACE_MODE.KB_PLUS_WEB,
    );
    expect(normalizeWorkspaceMode("unexpected")).toBe(DEFAULT_WORKSPACE_MODE);
    expect(normalizeWorkspaceMode(undefined)).toBe(DEFAULT_WORKSPACE_MODE);
  });

  test("strips assistant tool prefixes from MCP tool names", () => {
    expect(
      normalizeAssistantToolName(ASSISTANT_MCP_TOOL.SEARCH_WORKSPACE_KNOWLEDGE),
    ).toBe(ASSISTANT_TOOL.SEARCH_WORKSPACE_KNOWLEDGE);
    expect(
      normalizeAssistantToolName(`assistant__${ASSISTANT_TOOL.READ_CITATION_ANCHOR}`),
    ).toBe(ASSISTANT_TOOL.READ_CITATION_ANCHOR);
  });

  test("keeps kb-only tools as a subset of kb-plus-web tools", () => {
    expect(KB_PLUS_WEB_ALLOWED_TOOL_NAMES).toEqual(
      expect.arrayContaining([...KB_ONLY_ALLOWED_TOOL_NAMES]),
    );
  });
});
