import { fetchSourceInputSchema } from "@anchordesk/contracts";

import { fetchMarkdownSource } from "../fetch-source";
import { buildToolFailure } from "../tool-output";
import { runWithFetchSourceConcurrencyLimit } from "../tool-concurrency";
import {
  buildBlockedDomainFailure,
  parseAllowedDomains,
} from "./fetch-source-access";

export async function fetchSourceHandler(input: unknown) {
  const args = fetchSourceInputSchema.parse(input);
  const url = new URL(args.url);
  const allowed = parseAllowedDomains();

  if (allowed && !allowed.includes(url.hostname)) {
    return buildBlockedDomainFailure(url.hostname);
  }

  try {
    return {
      ok: true,
      source: await runWithFetchSourceConcurrencyLimit(() =>
        fetchMarkdownSource({
          url: args.url,
        }),
      ),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Source fetch failed";
    return buildToolFailure("FETCH_SOURCE_UNAVAILABLE", message, true);
  }
}
