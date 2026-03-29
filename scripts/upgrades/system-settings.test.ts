import { describe, expect, it } from "vitest";

import { systemSettingsUpgrade } from "./system-settings.mjs";

describe("systemSettingsUpgrade", () => {
  it("writes missing system settings and returns metadata", async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const client = {
      async query(sql: string, params: unknown[]) {
        calls.push({ sql, params });
      },
    };

    const result = await systemSettingsUpgrade.run({
      client,
      env: {
        REDIS_URL: "redis://custom:6379",
      },
    });

    expect(calls.length).toBeGreaterThan(5);
    expect(calls[0]?.params[0]).toBe("app_url");
    expect(calls.some((call) => call.params[0] === "redis_url" && call.params[1] === "redis://custom:6379"))
      .toBe(true);
    expect(result).toMatchObject({
      checkedCount: calls.length,
    });
  });
});
