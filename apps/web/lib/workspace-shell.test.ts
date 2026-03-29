import { describe, expect, test } from "vitest";

import {
  WORKSPACE_SHELL_COMPACT_BREAKPOINT,
  resolveWorkspaceShellNavigationMode,
} from "./workspace-shell";

describe("workspace shell responsive helpers", () => {
  test("switches to drawer navigation only below 720px", () => {
    expect(resolveWorkspaceShellNavigationMode(719)).toBe("drawer");
  });

  test("keeps the desktop sidebar at and above 720px", () => {
    expect(WORKSPACE_SHELL_COMPACT_BREAKPOINT).toBe(720);
    expect(resolveWorkspaceShellNavigationMode(720)).toBe("sidebar");
    expect(resolveWorkspaceShellNavigationMode(1280)).toBe("sidebar");
  });
});
