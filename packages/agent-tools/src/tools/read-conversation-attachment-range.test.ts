import { describe, expect, it } from "vitest";

import {
  buildReadConversationAttachmentRangeResult,
  MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES,
} from "./read-conversation-attachment-range";

describe("buildReadConversationAttachmentRangeResult", () => {
  it("groups blocks into pages and picks a covering anchor for each page", () => {
    const result = buildReadConversationAttachmentRangeResult({
      documentId: "11111111-1111-4111-8111-111111111111",
      documentTitle: "发布手册",
      documentPath: "/临时附件/发布手册.pdf",
      requestedPageStart: 2,
      requestedPageEnd: 3,
      totalPages: 6,
      blocks: [
        { pageNo: 2, orderIndex: 2, text: "第二页第二段" },
        { pageNo: 2, orderIndex: 1, text: "第二页第一段" },
        { pageNo: 3, orderIndex: 1, text: "第三页第一段" },
      ],
      anchors: [
        {
          anchorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          anchorLabel: "发布手册 · 第2页",
          pageStart: 2,
          pageEnd: 2,
        },
        {
          anchorId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          anchorLabel: "发布手册 · 第3页",
          pageStart: 2,
          pageEnd: 4,
        },
      ],
    });

    expect(result).toEqual({
      ok: true,
      document: {
        document_id: "11111111-1111-4111-8111-111111111111",
        document_title: "发布手册",
        document_path: "/临时附件/发布手册.pdf",
        requested_page_start: 2,
        requested_page_end: 3,
        loaded_page_start: 2,
        loaded_page_end: 3,
        total_pages: 6,
        truncated: false,
        max_page_window: MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES,
        pages: [
          {
            anchor_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            anchor_label: "发布手册 · 第2页",
            page_no: 2,
            text: "第二页第一段\n\n第二页第二段",
          },
          {
            anchor_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            anchor_label: "发布手册 · 第3页",
            page_no: 3,
            text: "第三页第一段",
          },
        ],
      },
    });
  });

  it("clamps oversized page windows to the configured maximum", () => {
    const result = buildReadConversationAttachmentRangeResult({
      documentId: "11111111-1111-4111-8111-111111111111",
      documentTitle: "发布手册",
      documentPath: "/临时附件/发布手册.pdf",
      requestedPageStart: 1,
      requestedPageEnd: 99,
      totalPages: 20,
      blocks: Array.from({ length: MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES + 2 }, (_, index) => ({
        pageNo: index + 1,
        orderIndex: 1,
        text: `第${index + 1}页`,
      })),
      anchors: Array.from({ length: MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES + 2 }, (_, index) => ({
        anchorId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        anchorLabel: `发布手册 · 第${index + 1}页`,
        pageStart: index + 1,
        pageEnd: index + 1,
      })),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.document.loaded_page_end).toBe(
      MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES,
    );
    expect(result.document.truncated).toBe(true);
    expect(result.document.pages).toHaveLength(MAX_READ_CONVERSATION_ATTACHMENT_RANGE_PAGES);
  });
});
