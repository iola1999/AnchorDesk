import { describe, expect, it } from "vitest";

import {
  buildReportSectionMarkdown,
  normalizeOutlineSections,
  slugifySectionKey,
} from "./report-generation";

describe("slugifySectionKey", () => {
  it("normalizes section keys into stable ASCII identifiers", () => {
    expect(slugifySectionKey("一、背景与范围")).toBe("section");
    expect(slugifySectionKey("Risk Analysis")).toBe("risk_analysis");
  });
});

describe("normalizeOutlineSections", () => {
  it("keeps order while de-duplicating section keys", () => {
    expect(
      normalizeOutlineSections([
        {
          title: "背景与范围",
          section_key: "section",
        },
        {
          title: "核心分析",
          section_key: "section",
        },
        {
          title: "结论与建议",
          section_key: "",
        },
      ]),
    ).toEqual([
      {
        title: "背景与范围",
        section_key: "section",
      },
      {
        title: "核心分析",
        section_key: "section_2",
      },
      {
        title: "结论与建议",
        section_key: "section_3",
      },
    ]);
  });
});

describe("buildReportSectionMarkdown", () => {
  it("appends citations and missing information in stable sections", () => {
    expect(
      buildReportSectionMarkdown({
        title: "风险分析",
        body: "这里是章节正文。",
        citations: [
          {
            anchor_id: "4e2f5a90-3b18-45cd-aa73-604c65b2c88b",
            label: "docs/spec.pdf · 第3页",
          },
        ],
        missingInformation: ["缺少最新预算表。"],
      }),
    ).toBe(
      [
        "## 风险分析",
        "",
        "这里是章节正文。",
        "",
        "### 依据",
        "- docs/spec.pdf · 第3页",
        "",
        "### 待补充信息",
        "- 缺少最新预算表。",
      ].join("\n"),
    );
  });

  it("omits empty helper sections", () => {
    expect(
      buildReportSectionMarkdown({
        title: "结论",
        body: "结论正文。",
        citations: [],
        missingInformation: [],
      }),
    ).toBe(["## 结论", "", "结论正文。"].join("\n"));
  });
});
