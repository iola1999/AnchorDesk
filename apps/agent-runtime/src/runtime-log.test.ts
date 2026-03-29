import { describe, expect, test } from "vitest";

import {
  buildClaudeAgentRuntimeLogContext,
  isClaudeAgentSdkDebugEnabled,
  serializeErrorForLog,
  splitClaudeAgentStderr,
} from "./runtime-log";

describe("buildClaudeAgentRuntimeLogContext", () => {
  test("returns a redacted summary of the anthropic runtime config", () => {
    expect(
      buildClaudeAgentRuntimeLogContext({
        ANTHROPIC_API_KEY: "sk-ant-api-key-123456",
        ANTHROPIC_BASE_URL: "http://localhost:8080",
        DEBUG_CLAUDE_AGENT_SDK: "true",
      }),
    ).toEqual({
      hasApiKey: true,
      baseUrl: "http://localhost:8080",
      sdkDebugEnabled: true,
    });
  });

  test("handles missing config values without leaking secrets", () => {
    expect(
      buildClaudeAgentRuntimeLogContext({
        ANTHROPIC_API_KEY: " ",
        ANTHROPIC_BASE_URL: "",
      }),
    ).toEqual({
      hasApiKey: false,
      baseUrl: null,
      sdkDebugEnabled: false,
    });
  });
});

describe("isClaudeAgentSdkDebugEnabled", () => {
  test("accepts common truthy forms", () => {
    expect(isClaudeAgentSdkDebugEnabled({ DEBUG_CLAUDE_AGENT_SDK: "1" })).toBe(true);
    expect(isClaudeAgentSdkDebugEnabled({ CLAUDE_AGENT_SDK_DEBUG: "enabled" })).toBe(
      true,
    );
  });

  test("defaults to false", () => {
    expect(isClaudeAgentSdkDebugEnabled({})).toBe(false);
  });
});

describe("splitClaudeAgentStderr", () => {
  test("normalizes stderr into non-empty lines", () => {
    expect(splitClaudeAgentStderr("line one\n\n line two \r\n")).toEqual([
      "line one",
      "line two",
    ]);
  });
});

describe("serializeErrorForLog", () => {
  test("keeps name, message, code, cause, and stack for Error objects", () => {
    const error = new Error("outer");
    (error as Error & { code?: string; cause?: Error }).code = "E_AUTH";
    (error as Error & { code?: string; cause?: Error }).cause = new Error("inner");

    expect(serializeErrorForLog(error)).toMatchObject({
      name: "Error",
      message: "outer",
      code: "E_AUTH",
      cause: "inner",
      stack: expect.any(String),
    });
  });
});
