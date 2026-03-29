import { describe, expect, it } from "vitest";

import {
  buildAuthSessionRedisKey,
  buildAuthUserSessionsRedisKey,
  registerAuthSession,
  revokeAuthSession,
  revokeUserSessions,
  touchAuthSession,
} from "./session-registry";

type FakeStore = {
  sessionValues: Map<string, string>;
  keyExpirations: Map<string, number>;
  sets: Map<string, Set<string>>;
  exists: (key: string) => Promise<number>;
  set: (key: string, value: string, mode: "EX", seconds: number) => Promise<"OK">;
  expire: (key: string, seconds: number) => Promise<number>;
  del: (...keys: string[]) => Promise<number>;
  sadd: (key: string, ...members: string[]) => Promise<number>;
  srem: (key: string, ...members: string[]) => Promise<number>;
  smembers: (key: string) => Promise<string[]>;
};

function createFakeStore(): FakeStore {
  const sessionValues = new Map<string, string>();
  const keyExpirations = new Map<string, number>();
  const sets = new Map<string, Set<string>>();

  return {
    sessionValues,
    keyExpirations,
    sets,
    async exists(key) {
      return sessionValues.has(key) ? 1 : 0;
    },
    async set(key, value, mode, seconds) {
      if (mode !== "EX") {
        throw new Error(`Unsupported set mode: ${mode}`);
      }
      sessionValues.set(key, value);
      keyExpirations.set(key, seconds);
      return "OK";
    },
    async expire(key, seconds) {
      if (sessionValues.has(key) || sets.has(key)) {
        keyExpirations.set(key, seconds);
        return 1;
      }
      return 0;
    },
    async del(...keys) {
      let deleted = 0;
      for (const key of keys) {
        if (sessionValues.delete(key)) {
          deleted += 1;
        }
        if (sets.delete(key)) {
          deleted += 1;
        }
        keyExpirations.delete(key);
      }
      return deleted;
    },
    async sadd(key, ...members) {
      const set = sets.get(key) ?? new Set<string>();
      let added = 0;
      for (const member of members) {
        if (!set.has(member)) {
          set.add(member);
          added += 1;
        }
      }
      sets.set(key, set);
      return added;
    },
    async srem(key, ...members) {
      const set = sets.get(key);
      if (!set) {
        return 0;
      }
      let removed = 0;
      for (const member of members) {
        if (set.delete(member)) {
          removed += 1;
        }
      }
      if (set.size === 0) {
        sets.delete(key);
        keyExpirations.delete(key);
      }
      return removed;
    },
    async smembers(key) {
      return Array.from(sets.get(key) ?? []);
    },
  };
}

describe("auth session registry", () => {
  it("registers a session key and user session index with the same ttl", async () => {
    const store = createFakeStore();

    await registerAuthSession({
      store,
      sessionId: "session-1",
      userId: "user-1",
      maxAgeSeconds: 1800,
    });

    expect(store.sessionValues.get(buildAuthSessionRedisKey("session-1"))).toBe("user-1");
    expect(store.keyExpirations.get(buildAuthSessionRedisKey("session-1"))).toBe(1800);
    expect(store.sets.get(buildAuthUserSessionsRedisKey("user-1"))).toEqual(
      new Set(["session-1"]),
    );
    expect(store.keyExpirations.get(buildAuthUserSessionsRedisKey("user-1"))).toBe(1800);
  });

  it("touches an active session and refreshes both ttl values", async () => {
    const store = createFakeStore();
    await registerAuthSession({
      store,
      sessionId: "session-1",
      userId: "user-1",
      maxAgeSeconds: 600,
    });

    const touched = await touchAuthSession({
      store,
      sessionId: "session-1",
      userId: "user-1",
      maxAgeSeconds: 1200,
    });

    expect(touched).toBe(true);
    expect(store.keyExpirations.get(buildAuthSessionRedisKey("session-1"))).toBe(1200);
    expect(store.keyExpirations.get(buildAuthUserSessionsRedisKey("user-1"))).toBe(1200);
  });

  it("returns false when trying to touch a revoked session", async () => {
    const store = createFakeStore();

    const touched = await touchAuthSession({
      store,
      sessionId: "missing-session",
      userId: "user-1",
      maxAgeSeconds: 1200,
    });

    expect(touched).toBe(false);
  });

  it("removes a single session from both the session key and user index", async () => {
    const store = createFakeStore();
    await registerAuthSession({
      store,
      sessionId: "session-1",
      userId: "user-1",
      maxAgeSeconds: 600,
    });

    await revokeAuthSession({
      store,
      sessionId: "session-1",
      userId: "user-1",
    });

    expect(store.sessionValues.has(buildAuthSessionRedisKey("session-1"))).toBe(false);
    expect(store.sets.has(buildAuthUserSessionsRedisKey("user-1"))).toBe(false);
  });

  it("revokes all sessions that belong to a user", async () => {
    const store = createFakeStore();
    await registerAuthSession({
      store,
      sessionId: "session-1",
      userId: "user-1",
      maxAgeSeconds: 600,
    });
    await registerAuthSession({
      store,
      sessionId: "session-2",
      userId: "user-1",
      maxAgeSeconds: 600,
    });

    const revokedCount = await revokeUserSessions({
      store,
      userId: "user-1",
    });

    expect(revokedCount).toBe(2);
    expect(store.sessionValues.size).toBe(0);
    expect(store.sets.size).toBe(0);
  });
});
