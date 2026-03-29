import { readConfiguredRuntimeValue } from "./runtime-settings";

type RuntimeEnv = Record<string, string | undefined>;

export function getConfiguredAnthropicApiKey(env: RuntimeEnv = process.env) {
  return readConfiguredRuntimeValue(env.ANTHROPIC_API_KEY);
}

export function getConfiguredAnthropicBaseUrl(env: RuntimeEnv = process.env) {
  return readConfiguredRuntimeValue(env.ANTHROPIC_BASE_URL);
}

export function buildAnthropicClientConfig(env: RuntimeEnv = process.env) {
  const apiKey = getConfiguredAnthropicApiKey(env);
  const baseURL = getConfiguredAnthropicBaseUrl(env);

  return {
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  };
}

export function buildClaudeAgentEnv(env: RuntimeEnv = process.env): RuntimeEnv {
  return {
    ...env,
    ANTHROPIC_API_KEY: getConfiguredAnthropicApiKey(env),
    ANTHROPIC_BASE_URL: getConfiguredAnthropicBaseUrl(env),
  };
}
