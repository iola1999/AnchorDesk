import {
  DEFAULT_FETCH_SOURCE_MAX_CONCURRENCY,
  MAX_FETCH_SOURCE_BATCH_URLS,
} from "@anchordesk/contracts";

type EnvMap = Record<string, string | undefined>;

function parsePositiveInt(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

class AsyncConcurrencyGate {
  private activeCount = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  async run<T>(task: () => Promise<T>) {
    await this.acquire();

    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private async acquire() {
    if (this.activeCount < this.limit) {
      this.activeCount += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  private release() {
    const next = this.waiters.shift();
    if (next) {
      next();
      return;
    }

    this.activeCount = Math.max(0, this.activeCount - 1);
  }
}

let fetchSourceGate: AsyncConcurrencyGate | null = null;

export function resolveFetchSourceMaxConcurrency(env: EnvMap = process.env) {
  const configured = parsePositiveInt(env.FETCH_SOURCE_MAX_CONCURRENCY);

  return Math.min(
    configured ?? DEFAULT_FETCH_SOURCE_MAX_CONCURRENCY,
    MAX_FETCH_SOURCE_BATCH_URLS,
  );
}

function getFetchSourceGate() {
  if (!fetchSourceGate) {
    fetchSourceGate = new AsyncConcurrencyGate(resolveFetchSourceMaxConcurrency());
  }

  return fetchSourceGate;
}

export async function runWithFetchSourceConcurrencyLimit<T>(task: () => Promise<T>) {
  return await getFetchSourceGate().run(task);
}

export async function mapWithConcurrencyLimit<T, TResult>(
  values: T[],
  limit: number,
  mapper: (value: T, index: number) => Promise<TResult>,
) {
  if (values.length === 0) {
    return [] as TResult[];
  }

  const normalizedLimit = Math.max(1, Math.trunc(limit));
  const results = new Array<TResult>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(values[currentIndex] as T, currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(normalizedLimit, values.length) }, () => worker()),
  );

  return results;
}

export function _resetToolConcurrencyForTest() {
  fetchSourceGate = null;
}
