// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { WorkspaceLifecyclePanel } from "./workspace-lifecycle-panel";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const messageApi = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/components/shared/message-provider", () => ({
  useMessage: () => messageApi,
}));

describe("WorkspaceLifecyclePanel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    pushMock.mockReset();
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

  test("shows server error when delete request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "删除失败示例" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );

    act(() => {
      root.render(
        createElement(WorkspaceLifecyclePanel, {
          workspaceId: "workspace-1",
          workspaceTitle: "空间 A",
        }),
      );
    });

    const openDialogButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("删除工作空间"),
    );
    expect(openDialogButton).toBeTruthy();

    await act(async () => {
      openDialogButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const confirmButton = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("确认删除"),
    );
    expect(confirmButton).toBeTruthy();

    await act(async () => {
      confirmButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.textContent).toContain("删除失败示例");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
