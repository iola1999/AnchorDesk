export class AgentQueryTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentQueryTimeoutError";
  }
}

async function nextWithTimeout<T>(input: {
  iterator: AsyncIterator<T>;
  timeoutMs: number;
  buildError: () => AgentQueryTimeoutError;
  onTimeout?: (error: AgentQueryTimeoutError) => Promise<void> | void;
}) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await new Promise<IteratorResult<T>>((resolve, reject) => {
      timer = setTimeout(() => {
        const error = input.buildError();
        Promise.resolve(input.onTimeout?.(error))
          .catch(() => null)
          .finally(() => {
            reject(error);
          });
      }, input.timeoutMs);
      timer.unref?.();

      Promise.resolve(input.iterator.next()).then(resolve, reject);
    });
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function* guardAgentQueryStream<T>(
  source: AsyncIterable<T>,
  input: {
    firstEventTimeoutMs: number;
    idleTimeoutMs: number;
    onTimeout?: (error: AgentQueryTimeoutError) => Promise<void> | void;
  },
) {
  const iterator = source[Symbol.asyncIterator]();
  let seenFirstEvent = false;

  try {
    while (true) {
      const result = await nextWithTimeout({
        iterator,
        timeoutMs: seenFirstEvent ? input.idleTimeoutMs : input.firstEventTimeoutMs,
        buildError: () =>
          new AgentQueryTimeoutError(
            seenFirstEvent
              ? "Claude Agent SDK query went idle."
              : "Claude Agent SDK query timed out before first event.",
          ),
        onTimeout: input.onTimeout,
      });

      if (result.done) {
        return;
      }

      seenFirstEvent = true;
      yield result.value;
    }
  } finally {
    await iterator.return?.();
  }
}
