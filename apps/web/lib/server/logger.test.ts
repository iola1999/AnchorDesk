import { describe, expect, test } from "vitest";

import { buildRequestLogContext, resolveRequestId } from "./logger";

describe("resolveRequestId", () => {
  test("reuses x-request-id when provided", () => {
    const request = new Request("http://localhost:3000/api/health", {
      headers: {
        "x-request-id": "req-123",
      },
    });

    expect(resolveRequestId(request)).toBe("req-123");
  });

  test("generates a request id when the header is missing", () => {
    const request = new Request("http://localhost:3000/api/health");

    expect(resolveRequestId(request)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
    );
  });
});

describe("buildRequestLogContext", () => {
  test("keeps the stable fields needed by route handlers", () => {
    expect(
      buildRequestLogContext(
        new Request("http://localhost:3000/api/conversations/123/messages?foo=bar", {
          method: "POST",
        }),
        "req-123",
      ),
    ).toEqual({
      requestId: "req-123",
      method: "POST",
      path: "/api/conversations/123/messages",
    });
  });
});
