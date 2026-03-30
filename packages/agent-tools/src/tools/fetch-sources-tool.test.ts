import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { fetchSourcesHandler } from "./fetch-sources-tool";

const originalFetch = global.fetch;
const originalFetchAllowedDomains = process.env.FETCH_ALLOWED_DOMAINS;
const originalFetchSourceMaxConcurrency = process.env.FETCH_SOURCE_MAX_CONCURRENCY;

beforeEach(() => {
  delete process.env.FETCH_ALLOWED_DOMAINS;
  delete process.env.FETCH_SOURCE_MAX_CONCURRENCY;
});

afterEach(() => {
  global.fetch = originalFetch;

  if (originalFetchAllowedDomains === undefined) {
    delete process.env.FETCH_ALLOWED_DOMAINS;
  } else {
    process.env.FETCH_ALLOWED_DOMAINS = originalFetchAllowedDomains;
  }

  if (originalFetchSourceMaxConcurrency === undefined) {
    delete process.env.FETCH_SOURCE_MAX_CONCURRENCY;
  } else {
    process.env.FETCH_SOURCE_MAX_CONCURRENCY = originalFetchSourceMaxConcurrency;
  }
});

describe("fetchSourcesHandler", () => {
  test("deduplicates urls and returns fetched sources in input order", async () => {
    global.fetch = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { url: string };
      return new Response(
        `---
title: ${body.url}
---

# ${body.url}

Body for ${body.url}
`,
        {
          status: 200,
          headers: {
            "content-type": "text/markdown; charset=utf-8",
          },
        },
      );
    });

    await expect(
      fetchSourcesHandler({
        urls: [
          "https://example.com/a",
          "https://example.com/b",
          "https://example.com/a",
        ],
      }),
    ).resolves.toMatchObject({
      ok: true,
      sources: [
        expect.objectContaining({ url: "https://example.com/a" }),
        expect.objectContaining({ url: "https://example.com/b" }),
      ],
      failures: [],
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("returns per-url failures without dropping successful fetches", async () => {
    process.env.FETCH_ALLOWED_DOMAINS = "example.com";

    global.fetch = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { url: string };
      return new Response(
        `---
title: ${body.url}
---

# ${body.url}

Body for ${body.url}
`,
        {
          status: 200,
          headers: {
            "content-type": "text/markdown; charset=utf-8",
          },
        },
      );
    });

    await expect(
      fetchSourcesHandler({
        urls: ["https://example.com/a", "https://blocked.example/b"],
      }),
    ).resolves.toMatchObject({
      ok: true,
      sources: [expect.objectContaining({ url: "https://example.com/a" })],
      failures: [
        {
          url: "https://blocked.example/b",
          error: {
            code: "FETCH_BLOCKED_DOMAIN",
            message: "Domain blocked.example is not allowed",
            retryable: false,
          },
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
