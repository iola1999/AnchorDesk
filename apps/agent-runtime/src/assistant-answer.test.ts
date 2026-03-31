import { describe, expect, it } from "vitest";

import { GROUNDED_EVIDENCE_KIND } from "@anchordesk/contracts";

import {
  materializeAssistantAnswer,
  toDisplayInlineCitationText,
  type CollectedGroundedEvidence,
} from "./assistant-answer";

const evidenceRegistry: CollectedGroundedEvidence[] = [
  {
    citationId: 2,
    evidence: {
      evidence_id: "web:https://example.com/post",
      kind: GROUNDED_EVIDENCE_KIND.WEB_PAGE,
      url: "https://example.com/post",
      domain: "example.com",
      title: "公开网页",
      label: "公开网页 · example.com",
      quote_text: "网页摘录",
      source_scope: "web",
      library_title: null,
    },
  },
  {
    citationId: 7,
    evidence: {
      evidence_id: "anchor:550e8400-e29b-41d4-a716-446655440000",
      kind: GROUNDED_EVIDENCE_KIND.DOCUMENT_ANCHOR,
      anchor_id: "550e8400-e29b-41d4-a716-446655440000",
      document_path: "知识库/发布手册.md",
      page_no: 1,
      label: "知识库/发布手册.md · 第1页",
      quote_text: "文档摘录",
      source_scope: "workspace_private",
      library_title: null,
    },
  },
];

describe("toDisplayInlineCitationText", () => {
  it("rewrites raw citation tokens into display markers", () => {
    expect(toDisplayInlineCitationText("结论[[cite:2]][[cite:7]]")).toBe("结论[^2][^7]");
  });
});

describe("materializeAssistantAnswer", () => {
  it("normalizes cited evidence into display-order markers", () => {
    expect(
      materializeAssistantAnswer({
        rawText: "第一段[[cite:7]] 第二段[[cite:2]][[cite:7]]",
        evidenceRegistry,
      }),
    ).toEqual({
      answerMarkdown: "第一段[^1] 第二段[^2][^1]",
      citations: [evidenceRegistry[1].evidence, evidenceRegistry[0].evidence],
    });
  });

  it("fails closed when the answer references an unknown citation id", () => {
    expect(() =>
      materializeAssistantAnswer({
        rawText: "第一段[[cite:99]]",
        evidenceRegistry,
      }),
    ).toThrow("Assistant answer referenced unknown citation id 99.");
  });

  it("fails closed when evidence exists but the answer omits markers", () => {
    expect(() =>
      materializeAssistantAnswer({
        rawText: "这是没有任何引用标记的回答",
        evidenceRegistry,
      }),
    ).toThrow("Assistant answer missing required citation markers.");
  });
});
