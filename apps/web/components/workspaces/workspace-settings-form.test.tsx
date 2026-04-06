// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { WorkspaceSettingsForm } from "./workspace-settings-form";

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

describe("WorkspaceSettingsForm", () => {
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

  test("reports error message when save request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "保存失败示例" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    act(() => {
      root.render(
        createElement(WorkspaceSettingsForm, {
          workspaceId: "workspace-1",
          initialTitle: "空间 A",
          initialPrompt: "",
        }),
      );
    });

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(messageApi.error).toHaveBeenCalledWith("保存失败示例");
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
