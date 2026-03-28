import { describe, expect, it } from "vitest";
import {
  DEFAULT_GROUNDED_ANSWER_CONFIDENCE,
  GROUNDED_ANSWER_CONFIDENCE,
} from "@knowledge-assistant/contracts";

import { normalizeGroundedAnswer } from "./grounded-answer";

const evidence = [
  {
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
        confidence: GROUNDED_ANSWER_CONFIDENCE.HIGH,
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
        label: "资料库/项目A/发布手册.pdf · 第12页 · 第8节",
        quote_text: "发布前需完成回归测试并通知相关成员。",
      },
    ]);
  });

  it("marks the answer unsupported when no validated citation survives", () => {
    const result = normalizeGroundedAnswer({
      draftText: "目前资料不足，无法直接确认上线检查项。",
      evidence: [],
      parsed: {
        answer_markdown: "目前资料不足，无法直接确认上线检查项。",
        confidence: GROUNDED_ANSWER_CONFIDENCE.MEDIUM,
        unsupported_reason: null,
        citations: [
          {
            anchor_id: "550e8400-e29b-41d4-a716-446655440001",
            label: "不存在的引用",
            quote_text: "不应保留",
          },
        ],
        missing_information: ["需要补充更完整的发布资料"],
      },
    });

    expect(result.citations).toEqual([]);
    expect(result.unsupported_reason).toBe(
      "No supporting evidence was retrieved from the workspace or external tools.",
    );
    expect(result.confidence).toBe(DEFAULT_GROUNDED_ANSWER_CONFIDENCE);
    expect(result.missing_information).toEqual(["需要补充更完整的发布资料"]);
  });
});
