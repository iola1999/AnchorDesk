import { describe, expect, test } from "vitest";

import {
  buildDocumentViewerPages,
  resolveDocumentViewerPageScope,
} from "./document-view";

describe("buildDocumentViewerPages", () => {
  test("groups blocks by page and sorts them by page then order", () => {
    const pages = buildDocumentViewerPages({
      blocks: [
        {
          id: "block-2",
          pageNo: 2,
          orderIndex: 2,
          blockType: "paragraph",
          text: "第二页第二块",
          headingPath: [],
          sectionLabel: null,
        },
        {
          id: "block-1",
          pageNo: 1,
          orderIndex: 1,
          blockType: "heading",
          text: "第一页标题",
          headingPath: ["第一页标题"],
          sectionLabel: "第1条",
        },
        {
          id: "block-3",
          pageNo: 2,
          orderIndex: 1,
          blockType: "paragraph",
          text: "第二页第一块",
          headingPath: ["第一页标题"],
          sectionLabel: null,
        },
      ],
      anchors: [],
    });

    expect(pages.map((page) => page.pageNo)).toEqual([1, 2]);
    expect(pages[1]?.blocks.map((block) => block.id)).toEqual(["block-3", "block-2"]);
  });

  test("marks the selected anchor and its source block", () => {
    const pages = buildDocumentViewerPages({
      blocks: [
        {
          id: "block-a",
          pageNo: 3,
          orderIndex: 1,
          blockType: "paragraph",
          text: "发布前需完成回归测试。",
          headingPath: ["上线检查"],
          sectionLabel: "第8节",
        },
      ],
      anchors: [
        {
          id: "anchor-a",
          pageNo: 3,
          blockId: "block-a",
          anchorText: "发布前需完成回归测试。",
          anchorLabel: "资料库/发布手册.pdf · 第3页 · 第8节",
        },
      ],
      highlightedAnchorId: "anchor-a",
    });

    expect(pages[0]?.anchors[0]).toMatchObject({
      id: "anchor-a",
      isHighlighted: true,
    });
    expect(pages[0]?.blocks[0]).toMatchObject({
      id: "block-a",
      isHighlighted: true,
      anchorCount: 1,
    });
  });
});

describe("resolveDocumentViewerPageScope", () => {
  test("prefers the highlighted anchor page over the requested page", () => {
    expect(
      resolveDocumentViewerPageScope({
        highlightedAnchorPage: 12,
        requestedPage: 3,
      }),
    ).toEqual({
      focusPage: 12,
      pageStart: 12,
      pageEnd: 12,
    });
  });

  test("clamps invalid requests to the first page and can expand around the focus page", () => {
    expect(
      resolveDocumentViewerPageScope({
        requestedPage: 0,
        radius: 1,
      }),
    ).toEqual({
      focusPage: 1,
      pageStart: 1,
      pageEnd: 2,
    });
  });

  test("treats non-finite requested pages as the first page", () => {
    expect(
      resolveDocumentViewerPageScope({
        requestedPage: Number.NaN,
        radius: 2,
      }),
    ).toEqual({
      focusPage: 1,
      pageStart: 1,
      pageEnd: 3,
    });
  });
});
