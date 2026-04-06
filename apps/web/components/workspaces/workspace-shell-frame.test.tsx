// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { WorkspaceShellFrame } from "./workspace-shell-frame";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspaces/workspace-1/knowledge-base",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
  useSession: () => ({
    data: {
      user: {
        name: "Fan",
        username: "fan",
      },
    },
  }),
}));

describe("WorkspaceShellFrame", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    window.matchMedia ??= ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList);
    if (!("ResizeObserver" in window)) {
      class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
      }

      Object.defineProperty(window, "ResizeObserver", {
        configurable: true,
        writable: true,
        value: ResizeObserverMock,
      });
    }

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  test("marks the active workspace section with page semantics", () => {
    act(() => {
      root.render(
        createElement(WorkspaceShellFrame, {
          workspace: { id: "workspace-1", title: "Alpha" },
          workspaces: [{ id: "workspace-1", title: "Alpha" }],
          conversations: [],
          activeView: "knowledge-base",
          currentUser: { username: "fan", isSuperAdmin: true },
          canAccessSystemSettings: true,
          breadcrumbs: [{ label: "空间", href: "/workspaces" }, { label: "Alpha" }],
          children: createElement("div", null, "content"),
        }),
      );
    });

    const currentLink = container.querySelector('a[aria-current="page"]');
    expect(currentLink?.textContent).toContain("资料库");
  });
});
