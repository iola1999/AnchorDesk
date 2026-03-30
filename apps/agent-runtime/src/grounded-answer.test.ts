import { describe, expect, it } from "vitest";
import { groundedAnswerSchema } from "@anchordesk/contracts";

import { normalizeGroundedAnswer } from "./grounded-answer";

const evidence = [
  {
    evidence_id: "anchor:550e8400-e29b-41d4-a716-446655440000",
    kind: "document_anchor" as const,
    anchor_id: "550e8400-e29b-41d4-a716-446655440000",
    document_path: "资料库/项目A/发布手册.pdf",
    page_no: 12,
    label: "资料库/项目A/发布手册.pdf · 第12页 · 第8节",
    quote_text: "发布前需完成回归测试并通知相关成员。",
  },
];

describe("normalizeGroundedAnswer", () => {
  it("keeps only citations that exist in validated evidence", () => {
    const result = normalizeGroundedAnswer({
      draftText: "依据发布手册，上线前需要先完成回归测试。",
      evidence,
      parsed: {
        answer_markdown: "依据发布手册，上线前需要先完成回归测试。",
        citations: [
          {
            evidence_id: "anchor:550e8400-e29b-41d4-a716-446655440000",
          },
          {
            evidence_id: "anchor:550e8400-e29b-41d4-a716-446655440001",
          },
        ],
      },
    });

    expect(result.citations).toEqual([
      {
        evidence_id: "anchor:550e8400-e29b-41d4-a716-446655440000",
        kind: "document_anchor",
        anchor_id: "550e8400-e29b-41d4-a716-446655440000",
        document_path: "资料库/项目A/发布手册.pdf",
        page_no: 12,
        label: "资料库/项目A/发布手册.pdf · 第12页 · 第8节",
        quote_text: "发布前需完成回归测试并通知相关成员。",
      },
    ]);
  });

  it("keeps the answer text when no validated citation survives", () => {
    const result = normalizeGroundedAnswer({
      draftText: "目前资料不足，无法直接确认上线检查项。",
      evidence: [],
      parsed: {
        answer_markdown: "目前资料不足，无法直接确认上线检查项。",
        citations: [
          {
            evidence_id: "anchor:550e8400-e29b-41d4-a716-446655440001",
          },
        ],
      },
    });

    expect(result.citations).toEqual([]);
    expect(result.answer_markdown).toBe("目前资料不足，无法直接确认上线检查项。");
  });

  it("accepts grounded answers without confidence metadata", () => {
    expect(
      groundedAnswerSchema.parse({
        answer_markdown: "你好，有什么我直接帮你处理的？",
        citations: [],
      }),
    ).toEqual({
      answer_markdown: "你好，有什么我直接帮你处理的？",
      citations: [],
    });
  });

  it("keeps validated web citations alongside document anchors", () => {
    const result = normalizeGroundedAnswer({
      draftText: "我补充看了公开网页和资料库文档。",
      evidence: [
        ...evidence,
        {
          evidence_id: "web:https://example.com/post",
          kind: "web_page" as const,
          url: "https://example.com/post",
          domain: "example.com",
          title: "最新局势说明",
          label: "最新局势说明 · example.com",
          quote_text: "该文称最新变化出现在上周末。",
          source_scope: "web" as const,
          library_title: null,
        },
      ],
      parsed: {
        answer_markdown: "我补充看了公开网页和资料库文档。",
        citations: [
          {
            evidence_id: "web:https://example.com/post",
          },
          {
            evidence_id: "anchor:550e8400-e29b-41d4-a716-446655440000",
          },
        ],
      },
    });

    expect(result.citations).toEqual([
      {
        evidence_id: "web:https://example.com/post",
        kind: "web_page",
        url: "https://example.com/post",
        domain: "example.com",
        title: "最新局势说明",
        label: "最新局势说明 · example.com",
        quote_text: "该文称最新变化出现在上周末。",
        source_scope: "web",
        library_title: null,
      },
      {
        evidence_id: "anchor:550e8400-e29b-41d4-a716-446655440000",
        kind: "document_anchor",
        anchor_id: "550e8400-e29b-41d4-a716-446655440000",
        document_path: "资料库/项目A/发布手册.pdf",
        page_no: 12,
        label: "资料库/项目A/发布手册.pdf · 第12页 · 第8节",
        quote_text: "发布前需完成回归测试并通知相关成员。",
      },
    ]);
  });
});
