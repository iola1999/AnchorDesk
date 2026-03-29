export const WORKSPACE_SHELL_COMPACT_BREAKPOINT = 720;
export const WORKSPACE_SHELL_DESKTOP_MEDIA_QUERY = `(min-width: ${WORKSPACE_SHELL_COMPACT_BREAKPOINT}px)`;

export function resolveWorkspaceShellNavigationMode(viewportWidth: number) {
  return viewportWidth < WORKSPACE_SHELL_COMPACT_BREAKPOINT ? "drawer" : "sidebar";
}
