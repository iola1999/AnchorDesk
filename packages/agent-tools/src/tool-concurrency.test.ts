import { afterEach, describe, expect, test } from "vitest";

import {
  DEFAULT_FETCH_SOURCE_MAX_CONCURRENCY,
  MAX_FETCH_SOURCE_BATCH_URLS,
} from "@anchordesk/contracts";

import {
  _resetToolConcurrencyForTest,
  resolveFetchSourceMaxConcurrency,
  runWithFetchSourceConcurrencyLimit,
} from "./tool-concurrency";

const originalFetchSourceMaxConcurrency = process.env.FETCH_SOURCE_MAX_CONCURRENCY;

afterEach(() => {
  _resetToolConcurrencyForTest();

  if (originalFetchSourceMaxConcurrency === undefined) {
    delete process.env.FETCH_SOURCE_MAX_CONCURRENCY;
  } else {
    process.env.FETCH_SOURCE_MAX_CONCURRENCY = originalFetchSourceMaxConcurrency;
  }
});

describe("resolveFetchSourceMaxConcurrency", () => {
  test("defaults to the shared fetch-source concurrency", () => {
    expect(resolveFetchSourceMaxConcurrency({})).toBe(
      DEFAULT_FETCH_SOURCE_MAX_CONCURRENCY,
    );
  });

  test("caps invalid and oversized values", () => {
    expect(resolveFetchSourceMaxConcurrency({ FETCH_SOURCE_MAX_CONCURRENCY: "0" })).toBe(
      DEFAULT_FETCH_SOURCE_MAX_CONCURRENCY,
    );
    expect(
      resolveFetchSourceMaxConcurrency({
        FETCH_SOURCE_MAX_CONCURRENCY: "999",
      }),
    ).toBe(MAX_FETCH_SOURCE_BATCH_URLS);
  });
});

describe("runWithFetchSourceConcurrencyLimit", () => {
  test("limits concurrent fetch tasks across independent invocations", async () => {
    process.env.FETCH_SOURCE_MAX_CONCURRENCY = "2";
    _resetToolConcurrencyForTest();

    let active = 0;
    let peak = 0;

    const tasks = Array.from({ length: 5 }, (_, index) =>
      runWithFetchSourceConcurrencyLimit(async () => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return index;
      }),
    );

    await expect(Promise.all(tasks)).resolves.toEqual([0, 1, 2, 3, 4]);
    expect(peak).toBe(2);
  });
});
