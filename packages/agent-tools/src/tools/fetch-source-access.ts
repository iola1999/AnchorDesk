import { buildToolFailure } from "../tool-output";

type EnvMap = Record<string, string | undefined>;

export function parseAllowedDomains(env: EnvMap = process.env) {
  const raw = (env.FETCH_ALLOWED_DOMAINS ?? "").trim();
  if (!raw) {
    return null;
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildBlockedDomainFailure(hostname: string) {
  return buildToolFailure(
    "FETCH_BLOCKED_DOMAIN",
    `Domain ${hostname} is not allowed`,
    false,
  );
}
