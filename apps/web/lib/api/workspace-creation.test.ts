import { describe, expect, test, vi } from "vitest";

import { createWorkspace } from "./workspace-creation";

describe("createWorkspace", () => {
  test("creates a workspace without creating any default conversation side effects", async () => {
    const slugExists = vi.fn().mockResolvedValue(false);
    const insertWorkspace = vi.fn().mockResolvedValue({
      id: "workspace-1",
      slug: "产品研究",
    });

    const workspace = await createWorkspace(
      {
        userId: "user-1",
        title: "产品研究",
      },
      {
        slugExists,
        insertWorkspace,
      },
    );

    expect(slugExists).toHaveBeenCalledWith("产品研究");
    expect(insertWorkspace).toHaveBeenCalledTimes(1);
    expect(insertWorkspace).toHaveBeenCalledWith({
      userId: "user-1",
      slug: "产品研究",
      title: "产品研究",
      industry: null,
      workspacePrompt: null,
    });
    expect(workspace).toEqual({
      id: "workspace-1",
      slug: "产品研究",
    });
  });

  test("increments the slug suffix until an available value is found", async () => {
    const slugExists = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const insertWorkspace = vi.fn().mockResolvedValue({
      id: "workspace-2",
      slug: "release-notes-3",
    });

    await createWorkspace(
      {
        userId: "user-1",
        title: "Release Notes",
      },
      {
        slugExists,
        insertWorkspace,
      },
    );

    expect(slugExists.mock.calls).toEqual([
      ["release-notes"],
      ["release-notes-2"],
      ["release-notes-3"],
    ]);
    expect(insertWorkspace).toHaveBeenCalledWith({
      userId: "user-1",
      slug: "release-notes-3",
      title: "Release Notes",
      industry: null,
      workspacePrompt: null,
    });
  });

  test("normalizes optional industry and workspace prompt before insert", async () => {
    const insertWorkspace = vi.fn().mockResolvedValue({ id: "workspace-3" });

    await createWorkspace(
      {
        userId: "user-9",
        title: "季度复盘",
        industry: "  SaaS  ",
        workspacePrompt: "  先给结论，再列依据。  ",
      },
      {
        slugExists: vi.fn().mockResolvedValue(false),
        insertWorkspace,
      },
    );

    expect(insertWorkspace).toHaveBeenCalledWith({
      userId: "user-9",
      slug: "季度复盘",
      title: "季度复盘",
      industry: "SaaS",
      workspacePrompt: "先给结论，再列依据。",
    });
  });
});
