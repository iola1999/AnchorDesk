import { describe, expect, test, vi } from "vitest";

import { createSseWriter } from "./sse-writer";

describe("createSseWriter", () => {
  test("treats ERR_INVALID_STATE as a closed stream and stops writing", () => {
    const controller = {
      enqueue: vi
        .fn()
        .mockImplementationOnce(() => undefined)
        .mockImplementationOnce(() => {
          const error = new TypeError("Invalid state: Controller is already closed");
          (error as TypeError & { code?: string }).code = "ERR_INVALID_STATE";
          throw error;
        }),
      close: vi.fn(),
      error: vi.fn(),
    };

    const writer = createSseWriter(controller as never, new TextEncoder());

    expect(writer.comment("keepalive")).toBe(true);
    expect(writer.comment("keepalive")).toBe(false);
    expect(writer.isClosed()).toBe(true);
  });
});
