import { describe, expect, it } from "vitest";

import {
  buildUpgradePlan,
  formatUpgradeList,
  isUpgradeRunnableInMode,
  parseUpgradeModeArg,
  validateUpgradeRegistry,
} from "./lib/upgrade-common.mjs";

describe("parseUpgradeModeArg", () => {
  it("parses explicit mode values", () => {
    expect(parseUpgradeModeArg(["--mode=apply-all"]))
      .toBe("apply-all");
    expect(parseUpgradeModeArg(["--mode", "check"], { defaultMode: "apply-blocking" }))
      .toBe("check");
  });

  it("rejects invalid values", () => {
    expect(() => parseUpgradeModeArg(["--mode=nope"]))
      .toThrow("Invalid --mode");
  });
});

describe("validateUpgradeRegistry", () => {
  it("normalizes flags and rejects duplicates", () => {
    const run = async () => ({ ok: true });

    expect(
      validateUpgradeRegistry([
        { key: "a", description: "A", run },
        { key: "b", description: "B", run, blocking: false, safeInDevStartup: true },
      ]),
    ).toEqual([
      { key: "a", description: "A", run, blocking: true, safeInDevStartup: false },
      { key: "b", description: "B", run, blocking: false, safeInDevStartup: true },
    ]);

    expect(() =>
      validateUpgradeRegistry([
        { key: "dup", description: "A", run },
        { key: "dup", description: "B", run },
      ]),
    ).toThrow("Duplicate upgrade key");
  });
});

describe("upgrade planning", () => {
  const run = async () => undefined;
  const upgrades = [
    { key: "safe-blocking", description: "safe", run, blocking: true, safeInDevStartup: true },
    { key: "manual-blocking", description: "manual", run, blocking: true, safeInDevStartup: false },
    { key: "non-blocking", description: "later", run, blocking: false, safeInDevStartup: false },
  ];

  it("selects runnable upgrades by mode", () => {
    expect(isUpgradeRunnableInMode(upgrades[0], "check")).toBe(false);
    expect(isUpgradeRunnableInMode(upgrades[0], "apply-safe-blocking")).toBe(true);
    expect(isUpgradeRunnableInMode(upgrades[1], "apply-safe-blocking")).toBe(false);
    expect(isUpgradeRunnableInMode(upgrades[1], "apply-blocking")).toBe(true);
    expect(isUpgradeRunnableInMode(upgrades[2], "apply-blocking")).toBe(false);
    expect(isUpgradeRunnableInMode(upgrades[2], "apply-all")).toBe(true);
  });

  it("separates pending, blocking, and runnable upgrades", () => {
    const appliedRowsByKey = new Map([["safe-blocking", { status: "completed" }]]);
    const plan = buildUpgradePlan(upgrades, appliedRowsByKey, "apply-safe-blocking");

    expect(plan.pending.map((item) => item.key)).toEqual(["manual-blocking", "non-blocking"]);
    expect(plan.runnable.map((item) => item.key)).toEqual([]);
    expect(plan.blockingPending.map((item) => item.key)).toEqual(["manual-blocking"]);
    expect(plan.nonBlockingPending.map((item) => item.key)).toEqual(["non-blocking"]);
  });

  it("formats upgrade lists for operator output", () => {
    expect(formatUpgradeList([{ key: "u1", description: "desc" }])).toBe("- u1 — desc");
  });
});
