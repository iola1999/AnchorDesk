import {
  DEFAULT_AGENT_RUNTIME_RESPOND_WORKER_CONCURRENCY,
  MAX_AGENT_RUNTIME_RESPOND_WORKER_CONCURRENCY,
} from "@anchordesk/contracts";

type EnvMap = Record<string, string | undefined>;

function parsePositiveInt(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function resolveRespondWorkerConcurrency(env: EnvMap = process.env) {
  const configured = parsePositiveInt(env.AGENT_RUNTIME_RESPOND_WORKER_CONCURRENCY);

  return Math.min(
    configured ?? DEFAULT_AGENT_RUNTIME_RESPOND_WORKER_CONCURRENCY,
    MAX_AGENT_RUNTIME_RESPOND_WORKER_CONCURRENCY,
  );
}
