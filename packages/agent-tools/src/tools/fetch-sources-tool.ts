import { fetchSourcesInputSchema } from "@anchordesk/contracts";

import { fetchMarkdownSource } from "../fetch-source";
import {
  mapWithConcurrencyLimit,
  resolveFetchSourceMaxConcurrency,
  runWithFetchSourceConcurrencyLimit,
} from "../tool-concurrency";
import { buildToolFailure, uniqueStrings } from "../tool-output";
import {
  buildBlockedDomainFailure,
  parseAllowedDomains,
} from "./fetch-source-access";

export async function fetchSourcesHandler(input: unknown) {
  const args = fetchSourcesInputSchema.parse(input);
  const allowed = parseAllowedDomains();
  const urls = uniqueStrings(args.urls);

  try {
    const results = await mapWithConcurrencyLimit(
      urls,
      resolveFetchSourceMaxConcurrency(),
      async (rawUrl) => {
        const url = new URL(rawUrl);

        if (allowed && !allowed.includes(url.hostname)) {
          return {
            url: rawUrl,
            ok: false as const,
            error: buildBlockedDomainFailure(url.hostname).error,
          };
        }

        try {
          return {
            url: rawUrl,
            ok: true as const,
            source: await runWithFetchSourceConcurrencyLimit(() =>
              fetchMarkdownSource({
                url: rawUrl,
              }),
            ),
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Source fetch failed";
          return {
            url: rawUrl,
            ok: false as const,
            error: {
              code: "FETCH_SOURCE_UNAVAILABLE",
              message,
              retryable: true,
            },
          };
        }
      },
    );

    return {
      ok: true as const,
      sources: results.flatMap((result) => (result.ok ? [result.source] : [])),
      failures: results.flatMap((result) =>
        result.ok
          ? []
          : [
              {
                url: result.url,
                error: result.error,
              },
            ],
      ),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Batch source fetch failed";
    return buildToolFailure("FETCH_SOURCES_UNAVAILABLE", message, true);
  }
}
