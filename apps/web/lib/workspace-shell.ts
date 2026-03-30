export const WORKSPACE_SHELL_COMPACT_BREAKPOINT = 720;
export const WORKSPACE_SHELL_DESKTOP_MEDIA_QUERY = `(min-width: ${WORKSPACE_SHELL_COMPACT_BREAKPOINT}px)`;
export const WORKSPACE_SHELL_SIDEBAR_CONTENT_CLASS =
  "flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 px-4 py-4";
export type WorkspaceShellContentScrollMode = "shell" | "contained";

export function resolveWorkspaceShellNavigationMode(viewportWidth: number) {
  return viewportWidth < WORKSPACE_SHELL_COMPACT_BREAKPOINT ? "drawer" : "sidebar";
}

export function resolveWorkspaceShellContentClass(
  contentScroll: WorkspaceShellContentScrollMode,
) {
  return contentScroll === "shell"
    ? "min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-1"
    : "min-h-0 min-w-0 overflow-hidden";
}
