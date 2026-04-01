import { describe, expect, it } from "vitest";

import {
  buildConversationAttachmentContextSection,
  buildConversationPromptWithAttachments,
  type ConversationAttachmentPromptAttachment,
} from "./conversation-attachment-context";

function createAttachment(
  overrides: Partial<ConversationAttachmentPromptAttachment> = {},
): ConversationAttachmentPromptAttachment {
  return {
    documentId: "11111111-1111-4111-8111-111111111111",
    documentTitle: "发布清单",
    documentPath: "/临时附件/发布清单.md",
    sourceFilename: "发布清单.md",
    pageCount: 2,
    blockCount: 2,
    pages: [
      {
        pageNo: 1,
        text: "第一页内容",
      },
      {
        pageNo: 2,
        text: "第二页内容",
      },
    ],
    ...overrides,
  };
}

describe("buildConversationAttachmentContextSection", () => {
  it("inlines the full text for short attachments", () => {
    const section = buildConversationAttachmentContextSection([
      createAttachment(),
    ]);

    expect(section).toContain("attachment_count: 1");
    expect(section).toContain("document_id: 11111111-1111-4111-8111-111111111111");
    expect(section).toContain("preload_status: full_text");
    expect(section).toContain("[Page 1]");
    expect(section).toContain("第一页内容");
    expect(section).toContain("[Page 2]");
    expect(section).toContain("第二页内容");
    expect(section).not.toContain("read_conversation_attachment_range");
  });

  it("falls back to excerpt mode for long attachments and points the agent to range reads", () => {
    const longText = "超长内容".repeat(4_000);
    const section = buildConversationAttachmentContextSection([
      createAttachment({
        documentId: "22222222-2222-4222-8222-222222222222",
        pageCount: 8,
        blockCount: 20,
        pages: [
          { pageNo: 1, text: longText },
          { pageNo: 2, text: "第二页补充" },
          { pageNo: 3, text: "第三页补充" },
        ],
      }),
    ]);

    expect(section).toContain("document_id: 22222222-2222-4222-8222-222222222222");
    expect(section).toContain("preload_status: excerpt_only");
    expect(section).toContain("remaining content omitted because this attachment is long");
    expect(section).toContain("read_conversation_attachment_range");
  });
});

describe("buildConversationPromptWithAttachments", () => {
  it("returns the original prompt when no attachment context is available", () => {
    expect(
      buildConversationPromptWithAttachments({
        prompt: "请总结这份材料",
        attachments: [],
      }),
    ).toBe("请总结这份材料");
  });

  it("appends a dedicated attachment context section after the user prompt", () => {
    const prompt = buildConversationPromptWithAttachments({
      prompt: "请总结这份材料",
      attachments: [createAttachment()],
    });

    expect(prompt).toContain("请总结这份材料");
    expect(prompt).toContain("The following conversation attachments are preloaded for quick reading.");
    expect(prompt).toContain("If you rely on attachment facts in the final answer");
    expect(prompt).toContain("document_id: 11111111-1111-4111-8111-111111111111");
  });
});
