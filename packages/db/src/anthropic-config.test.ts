import { describe, expect, test } from "vitest";

import {
  buildAnthropicClientConfig,
  buildClaudeAgentEnv,
  getConfiguredAnthropicApiKey,
  getConfiguredAnthropicBaseUrl,
} from "./anthropic-config";

describe("Anthropic runtime config helpers", () => {
  test("reads configured anthropic api key and base url from runtime env", () => {
    const env = {
      ANTHROPIC_API_KEY: "test-api-key",
      ANTHROPIC_BASE_URL: "https://anthropic-proxy.example.com",
    };

    expect(getConfiguredAnthropicApiKey(env)).toBe("test-api-key");
    expect(getConfiguredAnthropicBaseUrl(env)).toBe(
      "https://anthropic-proxy.example.com",
    );
  });

  test("treats empty and example placeholder values as unset", () => {
    const env = {
      ANTHROPIC_API_KEY: " example-anthropic-api-key ",
      ANTHROPIC_BASE_URL: " ",
    };

    expect(getConfiguredAnthropicApiKey(env)).toBeUndefined();
    expect(getConfiguredAnthropicBaseUrl(env)).toBeUndefined();
  });

  test("builds anthropic sdk client config with optional baseURL", () => {
    expect(
      buildAnthropicClientConfig({
        ANTHROPIC_API_KEY: "test-api-key",
        ANTHROPIC_BASE_URL: "https://anthropic-proxy.example.com",
      }),
    ).toEqual({
      apiKey: "test-api-key",
      baseURL: "https://anthropic-proxy.example.com",
    });

    expect(
      buildAnthropicClientConfig({
        ANTHROPIC_API_KEY: "test-api-key",
      }),
    ).toEqual({
      apiKey: "test-api-key",
    });
  });

  test("builds agent sdk env with sanitized anthropic credentials", () => {
    expect(
      buildClaudeAgentEnv({
        PATH: "/usr/bin",
        ANTHROPIC_API_KEY: "test-api-key",
        ANTHROPIC_BASE_URL: "https://anthropic-proxy.example.com",
      }),
    ).toMatchObject({
      PATH: "/usr/bin",
      ANTHROPIC_API_KEY: "test-api-key",
      ANTHROPIC_BASE_URL: "https://anthropic-proxy.example.com",
    });

    expect(
      buildClaudeAgentEnv({
        ANTHROPIC_API_KEY: "example-anthropic-api-key",
        ANTHROPIC_BASE_URL: "",
      }),
    ).toMatchObject({
      ANTHROPIC_API_KEY: undefined,
      ANTHROPIC_BASE_URL: undefined,
    });
  });
});
