import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const COMPONENTS_DIR = join(process.cwd(), "apps/web/components");
const ICONS_DIR = join(COMPONENTS_DIR, "icons");

function collectComponentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return entryPath === ICONS_DIR ? [] : collectComponentFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".tsx") ? [entryPath] : [];
  });
}

describe("web component icons", () => {
  it("keeps inline svg markup inside the shared icons directory", () => {
    const offenders = collectComponentFiles(COMPONENTS_DIR)
      .filter((filePath) => readFileSync(filePath, "utf8").includes("<svg"))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
