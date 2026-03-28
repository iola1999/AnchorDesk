import { describe, expect, test } from "vitest";

import {
  buildDirectoryPrefixes,
  buildHashedEmbedding,
  chunkTextSnippet,
  computeKeywordScore,
  extractStructuredTokens,
} from "./scoring";

describe("retrieval scoring helpers", () => {
  test("builds directory prefixes for nested logical paths", () => {
    expect(
      buildDirectoryPrefixes(
        "资料库/客户A/主合同/2024版",
        "资料库/客户A/主合同/2024版/采购主合同.pdf",
      ),
    ).toEqual([
      "资料库",
      "资料库/客户A",
      "资料库/客户A/主合同",
      "资料库/客户A/主合同/2024版",
    ]);
  });

  test("extracts structured tokens for Chinese clauses and numbered sections", () => {
    const tokens = extractStructuredTokens("依据第8条、第5.1款审查不可抗力免责");

    expect(tokens).toContain("第8条");
    expect(tokens).toContain("5.1");
    expect(tokens).toContain("不可");
    expect(tokens).toContain("免责");
  });

  test("produces deterministic hashed embeddings", () => {
    const first = buildHashedEmbedding("不可抗力条款审查", 16);
    const second = buildHashedEmbedding("不可抗力条款审查", 16);
    const third = buildHashedEmbedding("付款违约责任", 16);

    expect(first).toEqual(second);
    expect(first).not.toEqual(third);
    expect(first).toHaveLength(16);
  });

  test("truncates snippets with an ellipsis", () => {
    const snippet = chunkTextSnippet("a".repeat(330), 32);
    expect(snippet).toHaveLength(32);
    expect(snippet.endsWith("…")).toBe(true);
  });

  test("boosts scores when the query matches headings and body text", () => {
    const strong = computeKeywordScore("不可抗力免责", {
      document_path: "资料库/客户A/主合同/采购主合同.pdf",
      section_label: "第8条 不可抗力",
      heading_path: ["采购主合同", "违约责任", "不可抗力免责"],
      keywords: ["不可抗力", "免责"],
      chunk_text: "发生地震等不可抗力事件时，供应商可在法定范围内免责。",
    });

    const weak = computeKeywordScore("不可抗力免责", {
      document_path: "资料库/客户A/证据/邮件.pdf",
      section_label: "会议纪要",
      heading_path: ["会议纪要"],
      keywords: ["沟通记录"],
      chunk_text: "本次会议讨论了交付时间，但未涉及免责条款。",
    });

    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeGreaterThan(0.5);
    expect(weak).toBeLessThan(0.3);
  });
});
