import { afterEach, describe, expect, test, vi } from "vitest";

import {
  AgentQueryTimeoutError,
  guardAgentQueryStream,
} from "./agent-query-guard";

async function collect<T>(iterable: AsyncIterable<T>) {
  const values: T[] = [];
  for await (const value of iterable) {
    values.push(value);
  }
  return values;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("guardAgentQueryStream", () => {
  test("fails when the provider never yields its first event", async () => {
    vi.useFakeTimers();

    const onTimeout = vi.fn();
    const returnSpy = vi.fn(async () => ({ done: true, value: undefined }));
    const source: AsyncIterable<{ type: string }> = {
      [Symbol.asyncIterator]() {
        return {
          next: () => new Promise<IteratorResult<{ type: string }>>(() => undefined),
          return: returnSpy,
        };
      },
    };

    const result = collect(
      guardAgentQueryStream(source, {
        firstEventTimeoutMs: 5,
        idleTimeoutMs: 50,
        onTimeout,
      }),
    );
    const rejection = expect(result).rejects.toThrow(AgentQueryTimeoutError);
    const messageRejection = expect(result).rejects.toThrow(
      "Claude Agent SDK query timed out before first event.",
    );

    await vi.advanceTimersByTimeAsync(5);

    await rejection;
    await messageRejection;
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(returnSpy).toHaveBeenCalledTimes(1);
  });

  test("fails when the provider stream goes idle mid-run", async () => {
    vi.useFakeTimers();

    const onTimeout = vi.fn();
    const returnSpy = vi.fn(async () => ({ done: true, value: undefined }));
    const next = vi
      .fn<() => Promise<IteratorResult<{ type: string; subtype?: string }>>>()
      .mockResolvedValueOnce({
        done: false,
        value: { type: "system", subtype: "init" },
      })
      .mockImplementationOnce(
        () => new Promise<IteratorResult<{ type: string; subtype?: string }>>(() => undefined),
      );
    const source: AsyncIterable<{ type: string; subtype?: string }> = {
      [Symbol.asyncIterator]() {
        return {
          next,
          return: returnSpy,
        };
      },
    };

    const result = collect(
      guardAgentQueryStream(source, {
        firstEventTimeoutMs: 50,
        idleTimeoutMs: 5,
        onTimeout,
      }),
    );
    const rejection = expect(result).rejects.toThrow("Claude Agent SDK query went idle.");

    await vi.runAllTicks();
    await vi.advanceTimersByTimeAsync(5);

    await rejection;
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(returnSpy).toHaveBeenCalledTimes(1);
  });
});
