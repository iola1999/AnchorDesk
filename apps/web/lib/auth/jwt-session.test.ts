import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { describe, expect, it, vi } from "vitest";

import { syncAuthSessionToken } from "./jwt-session";

describe("syncAuthSessionToken", () => {
  it("assigns user identity, creates a jti, and registers a signed-in session", async () => {
    const registerSession = vi.fn().mockResolvedValue(undefined);
    const touchSession = vi.fn().mockResolvedValue(true);

    const token = (await syncAuthSessionToken({
      token: {},
      user: {
        id: "user-1",
        name: "Alice",
        username: "alice",
        isSuperAdmin: true,
      },
      registry: {
        registerSession,
        touchSession,
      },
      maxAgeSeconds: 1800,
      generateSessionId: () => "session-1",
    })) as JWT;

    expect(token.sub).toBe("user-1");
    expect(token.name).toBe("Alice");
    expect(token.username).toBe("alice");
    expect(token.isSuperAdmin).toBe(true);
    expect(token.sessionId).toBe("session-1");
    expect(registerSession).toHaveBeenCalledWith({
      sessionId: "session-1",
      userId: "user-1",
      maxAgeSeconds: 1800,
    });
    expect(touchSession).not.toHaveBeenCalled();
  });

  it("backfills a stable sessionId from authjs jti for legacy jwt sessions", async () => {
    const registerSession = vi.fn().mockResolvedValue(undefined);

    const token = (await syncAuthSessionToken({
      token: {
        sub: "user-1",
        username: "alice",
        name: "Alice",
        isSuperAdmin: true,
        jti: "authjs-jti-1",
      },
      registry: {
        registerSession,
        touchSession: vi.fn().mockResolvedValue(true),
      },
      maxAgeSeconds: 1800,
    })) as JWT;

    expect(token.sessionId).toBe("authjs-jti-1");
    expect(registerSession).toHaveBeenCalledWith({
      sessionId: "authjs-jti-1",
      userId: "user-1",
      maxAgeSeconds: 1800,
    });
  });

  it("refreshes an active session ttl on authenticated requests", async () => {
    const touchSession = vi.fn().mockResolvedValue(true);

    const token = await syncAuthSessionToken({
      token: {
        sub: "user-1",
        username: "alice",
        name: "Alice",
        isSuperAdmin: false,
        sessionId: "session-1",
      },
      registry: {
        registerSession: vi.fn().mockResolvedValue(undefined),
        touchSession,
      },
      maxAgeSeconds: 900,
    });

    expect(token).toMatchObject({
      sub: "user-1",
      username: "alice",
      name: "Alice",
      isSuperAdmin: false,
      sessionId: "session-1",
    });
    expect(touchSession).toHaveBeenCalledWith({
      sessionId: "session-1",
      userId: "user-1",
      maxAgeSeconds: 900,
    });
  });

  it("rejects a token when the session was revoked in redis", async () => {
    const token = await syncAuthSessionToken({
      token: {
        sub: "user-1",
        username: "alice",
        name: "Alice",
        isSuperAdmin: false,
        sessionId: "session-1",
      },
      registry: {
        registerSession: vi.fn().mockResolvedValue(undefined),
        touchSession: vi.fn().mockResolvedValue(false),
      },
      maxAgeSeconds: 900,
    });

    expect(token).toBeNull();
  });

  it("applies display name updates before reissuing the token", async () => {
    const token = (await syncAuthSessionToken({
      token: {
        sub: "user-1",
        username: "alice",
        name: "Alice",
        isSuperAdmin: true,
        sessionId: "session-1",
      },
      trigger: "update",
      session: {
        user: {
          id: "user-1",
          username: "alice",
          name: "Alice Cooper",
        },
      } as Session,
      registry: {
        registerSession: vi.fn().mockResolvedValue(undefined),
        touchSession: vi.fn().mockResolvedValue(true),
      },
      maxAgeSeconds: 900,
    })) as JWT;

    expect(token.name).toBe("Alice Cooper");
    expect(token.isSuperAdmin).toBe(true);
  });
});
