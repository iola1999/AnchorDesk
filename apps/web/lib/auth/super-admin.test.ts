import { describe, expect, test } from "vitest";

import { isSuperAdmin } from "./super-admin";

describe("isSuperAdmin", () => {
  test("returns true only when the user has the persisted super-admin flag", () => {
    expect(isSuperAdmin({ isSuperAdmin: true })).toBe(true);
    expect(isSuperAdmin({ isSuperAdmin: false })).toBe(false);
    expect(isSuperAdmin({})).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});
