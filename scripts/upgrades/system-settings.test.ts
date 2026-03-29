import { describe, expect, it } from "vitest";

import {
  systemSettingsDefaultValuesUpgrade,
  systemSettingsMetadataUpgrade,
  systemSettingsUpgrade,
} from "./system-settings.mjs";

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

  it("refreshes metadata for existing settings without overwriting values", async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const client = {
      async query(sql: string, params: unknown[]) {
        calls.push({ sql, params });
      },
    };

    const result = await systemSettingsMetadataUpgrade.run({
      client,
      env: {},
    });

    expect(calls.length).toBeGreaterThan(5);
    expect(calls[0]?.params).toEqual(
      expect.arrayContaining(["app_url", expect.any(String), expect.any(String)]),
    );
    expect(calls[0]?.sql).toContain("on conflict (setting_key) do update set");
    expect(calls[0]?.sql).not.toContain("value_text = excluded.value_text");
    expect(result).toMatchObject({
      checkedCount: calls.length,
    });
  });

  it("backfills defaults only when the current value is empty", async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const client = {
      async query(sql: string, params: unknown[]) {
        calls.push({ sql, params });
      },
    };

    const result = await systemSettingsDefaultValuesUpgrade.run({
      client,
      env: {},
    });

    expect(calls.length).toBeGreaterThan(5);
    expect(calls[0]?.sql).toContain("when btrim(coalesce(system_settings.value_text, '')) = ''");
    expect(calls[0]?.params).toEqual(
      expect.arrayContaining(["app_url", expect.any(String), expect.any(String)]),
    );
    expect(result).toMatchObject({
      checkedCount: calls.length,
    });
  });
});
