import { describe, expect, test } from "vitest";

import {
  KB_ONLY_ALLOWED_TOOL_NAMES,
  KB_PLUS_WEB_ALLOWED_TOOL_NAMES,
  WORKSPACE_MODE,
} from "@knowledge-assistant/contracts";

import { getAllowedTools } from "./run-agent-response";

describe("getAllowedTools", () => {
  test("limits kb-only mode to workspace retrieval tools", () => {
    expect(getAllowedTools(WORKSPACE_MODE.KB_ONLY)).toEqual([
      ...KB_ONLY_ALLOWED_TOOL_NAMES,
    ]);
  });

  test("enables web and report tools in kb-plus-web mode", () => {
    expect(getAllowedTools(WORKSPACE_MODE.KB_PLUS_WEB)).toEqual([
      ...KB_PLUS_WEB_ALLOWED_TOOL_NAMES,
    ]);
  });
});
