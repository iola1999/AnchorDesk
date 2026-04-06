// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { WorkspaceLibrarySubscriptions } from "./workspace-library-subscriptions";

const refreshMock = vi.fn();
const messageApi = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("@/components/shared/message-provider", () => ({
  useMessage: () => messageApi,
}));

describe("WorkspaceLibrarySubscriptions", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    refreshMock.mockReset();
    messageApi.success.mockReset();
    messageApi.error.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  test("subscribes library with searchable mode", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    act(() => {
      root.render(
        createElement(WorkspaceLibrarySubscriptions, {
          workspaceId: "workspace-1",
          libraries: [
            {
              id: "library-1",
              title: "设计系统",
              slug: "design-system",
              description: null,
              status: "active",
              documentCount: 12,
              subscriptionStatus: null,
              searchEnabled: false,
              updatedAt: "2026-04-07T00:00:00.000Z",
            },
          ],
        }),
      );
    });

    const actionButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("订阅并检索"),
    );
    expect(actionButton).toBeTruthy();

    await act(async () => {
      actionButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/workspaces/workspace-1/library-subscriptions", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        libraryId: "library-1",
        status: "active",
        searchEnabled: true,
      }),
    });
    expect(messageApi.success).toHaveBeenCalledWith("已启用订阅并参与检索");
  });
});
