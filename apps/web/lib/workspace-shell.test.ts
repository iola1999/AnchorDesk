import { describe, expect, test } from "vitest";

import {
  WORKSPACE_SHELL_COMPACT_BREAKPOINT,
  WORKSPACE_SHELL_SIDEBAR_CONTENT_CLASS,
  resolveWorkspaceShellContentClass,
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

  test("keeps desktop sidebar content shrinkable for long conversation titles", () => {
    expect(WORKSPACE_SHELL_SIDEBAR_CONTENT_CLASS).toContain("min-w-0");
    expect(WORKSPACE_SHELL_SIDEBAR_CONTENT_CLASS).toContain("flex-1");
  });

  test("uses shell scrolling when the whole right pane should respond to scroll", () => {
    const classes = resolveWorkspaceShellContentClass("shell");

    expect(classes).toContain("overflow-y-auto");
    expect(classes).toContain("overscroll-contain");
    expect(classes).toContain("pr-1");
  });

  test("keeps contained mode available for feature-local scroll regions", () => {
    const classes = resolveWorkspaceShellContentClass("contained");

    expect(classes).toContain("overflow-hidden");
    expect(classes).not.toContain("overflow-y-auto");
  });
});
