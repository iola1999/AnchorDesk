// @vitest-environment jsdom

import { describe, expect, test } from "vitest";

describe("React test environment", () => {
  test("enables act support in jsdom", () => {
    const reactActEnvironment = (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT;

    expect(reactActEnvironment).toBe(true);
  });
});
