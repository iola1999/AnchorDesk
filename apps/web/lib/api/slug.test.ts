import { describe, expect, test } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  test("keeps chinese characters and normalizes punctuation", () => {
    expect(slugify("  客户A / 主合同（2024版）  ")).toBe("客户a-主合同-2024版");
  });

  test("trims duplicate separators and limits length", () => {
    const value = `${"abc ".repeat(80)}!!`;
    const slug = slugify(value);

    expect(slug.startsWith("abc-abc-abc")).toBe(true);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.length).toBeLessThanOrEqual(120);
  });
});
