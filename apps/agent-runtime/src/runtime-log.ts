type RuntimeEnv = Record<string, string | undefined>;

function normalizeRuntimeValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function isClaudeAgentSdkDebugEnabled(env: RuntimeEnv = process.env) {
  const raw = normalizeRuntimeValue(
    env.DEBUG_CLAUDE_AGENT_SDK ?? env.CLAUDE_AGENT_SDK_DEBUG,
  );
  if (!raw) {
    return false;
  }

  return ["1", "true", "yes", "on", "enabled"].includes(raw.toLowerCase());
}

export function buildClaudeAgentRuntimeLogContext(env: RuntimeEnv = process.env) {
  const apiKey = normalizeRuntimeValue(env.ANTHROPIC_API_KEY);
  const baseUrl = normalizeRuntimeValue(env.ANTHROPIC_BASE_URL);

  return {
    hasApiKey: Boolean(apiKey),
    apiKeyPrefix: apiKey ? apiKey.slice(0, 16) : null,
    apiKeyLength: apiKey?.length ?? 0,
    baseUrl: baseUrl ?? null,
    sdkDebugEnabled: isClaudeAgentSdkDebugEnabled(env),
  };
}

export function splitClaudeAgentStderr(data: string) {
  return data
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function serializeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    const extra = error as Error & {
      code?: unknown;
      cause?: unknown;
    };

    return {
      name: error.name,
      message: error.message,
      code: typeof extra.code === "string" ? extra.code : null,
      cause:
        extra.cause instanceof Error
          ? extra.cause.message
          : typeof extra.cause === "string"
            ? extra.cause
            : null,
      stack: error.stack ?? null,
    };
  }

  if (error && typeof error === "object") {
    return {
      message: JSON.stringify(error),
    };
  }

  return {
    message: String(error),
  };
}
