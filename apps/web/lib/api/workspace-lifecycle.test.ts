import { describe, expect, it } from "vitest";

import {
  isWorkspaceArchived,
  resolveWorkspaceArchivedAt,
} from "./workspace-lifecycle";

describe("resolveWorkspaceArchivedAt", () => {
  it("keeps the current state when no archive flag is provided", () => {
    const currentArchivedAt = new Date("2026-03-29T12:00:00.000Z");

    expect(
      resolveWorkspaceArchivedAt({
        currentArchivedAt,
      }),
    ).toBe(currentArchivedAt);
  });

  it("sets archivedAt when archiving an active workspace", () => {
    const now = new Date("2026-03-29T13:00:00.000Z");

    expect(
      resolveWorkspaceArchivedAt({
        archived: true,
        currentArchivedAt: null,
        now,
      }),
    ).toBe(now);
  });

  it("clears archivedAt when restoring a workspace", () => {
    expect(
      resolveWorkspaceArchivedAt({
        archived: false,
        currentArchivedAt: new Date("2026-03-29T12:00:00.000Z"),
      }),
    ).toBeNull();
  });
});

describe("isWorkspaceArchived", () => {
  it("returns true only when archivedAt is a date", () => {
    expect(isWorkspaceArchived(new Date())).toBe(true);
    expect(isWorkspaceArchived(null)).toBe(false);
    expect(isWorkspaceArchived(undefined)).toBe(false);
  });
});
