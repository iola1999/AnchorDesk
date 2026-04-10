// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { KnowledgeBaseExplorer } from "./knowledge-base-explorer";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({
    id,
    children,
  }: {
    id?: string;
    children: React.ReactNode;
  }) => createElement("div", { "data-dnd-context-id": id }, children),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    isDragging: false,
    setNodeRef: () => undefined,
  }),
  useDroppable: () => ({
    isOver: false,
    setNodeRef: () => undefined,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspaces/workspace-1/knowledge-base",
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    prefetch,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    prefetch?: boolean;
  }) => createElement("a", { href, ...props, "data-prefetch": String(prefetch) }, children),
}));

describe("KnowledgeBaseExplorer", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  test("renders the read-only notice and back link for mounted libraries", () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "/",
          currentDirectoryId: null,
          directories: [],
          documents: [],
          documentsEndpoint: "/api/knowledge-libraries/library-1/documents",
          downloadEndpoint: "/api/knowledge-libraries/library-1/knowledge-base/download",
          editable: false,
          canManageTasks: false,
          mountedLibraries: [],
          presignEndpoint: "/api/knowledge-libraries/library-1/uploads/presign",
          readOnlyNotice: "已挂载只读 · 设计系统库",
          scopeLabel: "订阅资料库",
          backLink: { href: "/workspaces/workspace-1/knowledge-base", label: "返回我的资料" },
        }),
      );
    });

    expect(container.textContent).toContain("已挂载只读 · 设计系统库");
    expect(
      container.querySelector('a[href="/workspaces/workspace-1/knowledge-base"]')?.textContent,
    ).toContain("返回我的资料");
  });

  test("keeps the page header terse instead of repeating a long explainer", () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "/",
          currentDirectoryId: null,
          directories: [],
          documents: [],
          documentsEndpoint: "/api/workspaces/workspace-1/documents",
          downloadEndpoint: "/api/workspaces/workspace-1/knowledge-base/download",
          presignEndpoint: "/api/workspaces/workspace-1/uploads/presign",
        }),
      );
    });

    expect(container.textContent).toContain("资料库");
    expect(container.textContent).not.toContain("组织研究资料、技术文档和上传内容，供检索与引用使用。");
  });

  test("hides duplicate scope and root path labels on the default top-level page", () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "资料库",
          currentDirectoryId: null,
          directories: [],
          documents: [],
          documentsEndpoint: "/api/workspaces/workspace-1/documents",
          downloadEndpoint: "/api/workspaces/workspace-1/knowledge-base/download",
          presignEndpoint: "/api/workspaces/workspace-1/uploads/presign",
        }),
      );
    });

    const titleMatches = container.textContent?.match(/资料库/g) ?? [];
    const rootPathButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.trim() === "资料库",
    );

    expect(titleMatches).toHaveLength(1);
    expect(container.textContent).not.toContain("我的资料");
    expect(rootPathButton).toBeUndefined();
  });

  test("can hide the page-level header when embedded inside a management detail page", () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "/",
          currentDirectoryId: null,
          directories: [],
          documents: [],
          documentsEndpoint: "/api/knowledge-libraries/library-1/documents",
          downloadEndpoint: "/api/knowledge-libraries/library-1/knowledge-base/download",
          presignEndpoint: "/api/knowledge-libraries/library-1/uploads/presign",
          showPageHeader: false,
          scopeLabel: "全局资料库 · 示例",
        }),
      );
    });

    expect(container.textContent).toContain("全局资料库 · 示例");
    expect(container.textContent).not.toContain(
      "组织研究资料、技术文档和上传内容，供检索与引用使用。",
    );
  });

  test("filters documents by type query", async () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "/",
          currentDirectoryId: null,
          directories: [],
          documents: [
            {
              id: "doc-1",
              title: "文档一",
              sourceFilename: "资料甲",
              logicalPath: "/资料甲",
              directoryPath: "/",
              mimeType: "application/pdf",
              docType: "PDF",
              tags: [],
              status: "ready",
              createdAt: "2026-04-07T00:00:00.000Z",
              updatedAt: "2026-04-07T00:00:00.000Z",
              latestVersion: {
                id: "version-1",
                parseStatus: "ready",
                fileSizeBytes: 1200,
              },
              latestJob: null,
            },
            {
              id: "doc-2",
              title: "文档二",
              sourceFilename: "资料乙",
              logicalPath: "/资料乙",
              directoryPath: "/",
              mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              docType: "DOCX",
              tags: [],
              status: "ready",
              createdAt: "2026-04-07T00:00:00.000Z",
              updatedAt: "2026-04-07T00:00:00.000Z",
              latestVersion: {
                id: "version-2",
                parseStatus: "ready",
                fileSizeBytes: 1200,
              },
              latestJob: null,
            },
          ],
          presignEndpoint: "/api/workspaces/workspace-1/uploads/presign",
          downloadEndpoint: "/api/workspaces/workspace-1/knowledge-base/download",
          documentsEndpoint: "/api/workspaces/workspace-1/documents",
        }),
      );
    });

    const searchInput = container.querySelector(
      'input[placeholder="搜索目录、文件名或类型"]',
    ) as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(searchInput, "pdf");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("资料甲");
    expect(container.textContent).not.toContain("资料乙");
  });

  test("hides edit actions in read-only mode", () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "/",
          currentDirectoryId: null,
          directories: [],
          documents: [],
          presignEndpoint: "/api/knowledge-libraries/library-1/uploads/presign",
          downloadEndpoint: "/api/knowledge-libraries/library-1/knowledge-base/download",
          documentsEndpoint: "/api/knowledge-libraries/library-1/documents",
          editable: false,
          canManageTasks: false,
          mountedLibraries: [],
        }),
      );
    });

    expect(container.textContent).not.toContain("上传资料");
    expect(container.textContent).not.toContain("新建目录");
    expect(container.textContent).not.toContain("处理中任务");
  });

  test("uses a stable dnd context id to avoid hydration drift", () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "/",
          currentDirectoryId: null,
          directories: [],
          documents: [],
          documentsEndpoint: "/api/workspaces/workspace-1/documents",
          downloadEndpoint: "/api/workspaces/workspace-1/knowledge-base/download",
          presignEndpoint: "/api/workspaces/workspace-1/uploads/presign",
        }),
      );
    });

    expect(
      container.querySelector('[data-dnd-context-id="knowledge-base-dnd"]'),
    ).toBeTruthy();
  });

  test("disables document detail prefetch in the knowledge base list", () => {
    act(() => {
      root.render(
        createElement(KnowledgeBaseExplorer, {
          initialCurrentPath: "/",
          currentDirectoryId: null,
          directories: [],
          documents: [
            {
              id: "doc-1",
              title: "问题文档",
              sourceFilename: "问题文档.pdf",
              logicalPath: "/问题文档.pdf",
              directoryPath: "/",
              mimeType: "application/pdf",
              docType: "PDF",
              tags: [],
              status: "ready",
              createdAt: "2026-04-07T00:00:00.000Z",
              updatedAt: "2026-04-07T00:00:00.000Z",
              latestVersion: {
                id: "version-1",
                parseStatus: "ready",
                fileSizeBytes: 1200,
              },
              latestJob: null,
            },
          ],
          documentHrefBase: "/workspaces/workspace-1/documents",
          documentsEndpoint: "/api/workspaces/workspace-1/documents",
          downloadEndpoint: "/api/workspaces/workspace-1/knowledge-base/download",
          presignEndpoint: "/api/workspaces/workspace-1/uploads/presign",
        }),
      );
    });

    expect(
      container.querySelector('a[href="/workspaces/workspace-1/documents/doc-1"]')?.getAttribute(
        "data-prefetch",
      ),
    ).toBe("false");
  });
});
