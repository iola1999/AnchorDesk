import { describe, expect, test } from "vitest";

import { ASSISTANT_ALLOWED_TOOL_NAMES } from "@knowledge-assistant/contracts";

import { getAllowedTools } from "./run-agent-response";

describe("getAllowedTools", () => {
  test("always returns the full tool set", () => {
    expect(getAllowedTools()).toEqual([...ASSISTANT_ALLOWED_TOOL_NAMES]);
  });
});
