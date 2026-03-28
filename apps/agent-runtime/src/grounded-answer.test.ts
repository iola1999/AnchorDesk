import { describe, expect, it } from "vitest";

import { normalizeGroundedAnswer } from "./grounded-answer";

const evidence = [
  {
    anchor_id: "550e8400-e29b-41d4-a716-446655440000",
    document_path: "合同库/主合同.pdf",
    page_no: 12,
    label: "合同库/主合同.pdf · 第12页 · 第8条",
    quote_text: "发生不可抗力时，受影响一方应及时通知对方。",
  },
];

describe("normalizeGroundedAnswer", () => {
  it("keeps only citations that exist in validated evidence", () => {
    const result = normalizeGroundedAnswer({
      draftText: "依据合同约定，不可抗力发生后需要及时通知。",
      evidence,
      parsed: {
        answer_markdown: "依据合同约定，不可抗力发生后需要及时通知。",
        confidence: "high",
        unsupported_reason: null,
        citations: [
          {
            anchor_id: "550e8400-e29b-41d4-a716-446655440000",
            label: "模型自造标签",
            quote_text: "模型自造摘录",
          },
          {
            anchor_id: "550e8400-e29b-41d4-a716-446655440001",
            label: "不存在的引用",
            quote_text: "不应保留",
          },
        ],
        missing_information: [],
      },
    });

    expect(result.citations).toEqual([
      {
        anchor_id: "550e8400-e29b-41d4-a716-446655440000",
        label: "合同库/主合同.pdf · 第12页 · 第8条",
        quote_text: "发生不可抗力时，受影响一方应及时通知对方。",
      },
    ]);
  });

  it("marks the answer unsupported when no validated citation survives", () => {
    const result = normalizeGroundedAnswer({
      draftText: "目前资料不足，无法直接确认违约责任。",
      evidence: [],
      parsed: {
        answer_markdown: "目前资料不足，无法直接确认违约责任。",
        confidence: "medium",
        unsupported_reason: null,
        citations: [
          {
            anchor_id: "550e8400-e29b-41d4-a716-446655440001",
            label: "不存在的引用",
            quote_text: "不应保留",
          },
        ],
        missing_information: ["需要更多证据材料"],
      },
    });

    expect(result.citations).toEqual([]);
    expect(result.unsupported_reason).toBe(
      "No supporting evidence was retrieved from the workspace or external tools.",
    );
    expect(result.confidence).toBe("low");
    expect(result.missing_information).toEqual(["需要更多证据材料"]);
  });
});
