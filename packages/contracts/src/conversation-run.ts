export const STREAMING_ASSISTANT_HEARTBEAT_INTERVAL_MS = 10_000;
export const STREAMING_ASSISTANT_LEASE_TIMEOUT_MS = 45_000;

export type StreamingAssistantRunState = {
  run_started_at: string;
  run_last_heartbeat_at: string;
  run_lease_expires_at: string;
};

function asValidDate(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function readStreamingAssistantRunState(
  structuredJson: Record<string, unknown> | null | undefined,
): StreamingAssistantRunState | null {
  if (!structuredJson) {
    return null;
  }

  const startedAt = asValidDate(structuredJson.run_started_at);
  const lastHeartbeatAt = asValidDate(structuredJson.run_last_heartbeat_at);
  const leaseExpiresAt = asValidDate(structuredJson.run_lease_expires_at);

  if (!startedAt || !lastHeartbeatAt || !leaseExpiresAt) {
    return null;
  }

  return {
    run_started_at: startedAt.toISOString(),
    run_last_heartbeat_at: lastHeartbeatAt.toISOString(),
    run_lease_expires_at: leaseExpiresAt.toISOString(),
  };
}

export function buildStreamingAssistantRunState(input: {
  now?: Date;
  startedAt?: Date | string;
} = {}): StreamingAssistantRunState {
  const now = input.now ?? new Date();
  const startedAt = asValidDate(input.startedAt) ?? now;

  return {
    run_started_at: startedAt.toISOString(),
    run_last_heartbeat_at: now.toISOString(),
    run_lease_expires_at: new Date(
      now.getTime() + STREAMING_ASSISTANT_LEASE_TIMEOUT_MS,
    ).toISOString(),
  };
}

export function refreshStreamingAssistantRunState(
  structuredJson: Record<string, unknown> | null | undefined,
  now: Date = new Date(),
): StreamingAssistantRunState {
  const existing = readStreamingAssistantRunState(structuredJson);

  return buildStreamingAssistantRunState({
    now,
    startedAt: existing?.run_started_at ?? now,
  });
}

export function isStreamingAssistantRunExpired(input: {
  structuredJson?: Record<string, unknown> | null;
  createdAt?: Date | string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const state = readStreamingAssistantRunState(input.structuredJson ?? null);

  if (state) {
    return new Date(state.run_lease_expires_at).getTime() <= now.getTime();
  }

  const createdAt = asValidDate(input.createdAt ?? null);
  if (!createdAt) {
    return false;
  }

  return (
    createdAt.getTime() + STREAMING_ASSISTANT_LEASE_TIMEOUT_MS <= now.getTime()
  );
}
