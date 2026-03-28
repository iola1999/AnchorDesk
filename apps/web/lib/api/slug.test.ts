import { describe, expect, test } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  test("keeps chinese characters and normalizes punctuation", () => {
    expect(slugify("  项目A / 发布手册（2024版）  ")).toBe("项目a-发布手册-2024版");
  });

  test("trims duplicate separators and limits length", () => {
    const value = `${"abc ".repeat(80)}!!`;
    const slug = slugify(value);

    expect(slug.startsWith("abc-abc-abc")).toBe(true);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.length).toBeLessThanOrEqual(120);
  });
});
