import { describe, expect, test } from "vitest";

import { buildChunkSeeds } from "./chunking";

describe("buildChunkSeeds", () => {
  test("merges paragraphs under the same heading into one chunk", () => {
    const chunks = buildChunkSeeds([
      {
        id: "h1",
        pageNo: 1,
        orderIndex: 1,
        blockType: "heading",
        sectionLabel: "第8节",
        headingPath: ["发布手册", "上线前检查", "第8节 上线检查"],
        text: "第8节 上线检查",
      },
      {
        id: "b1",
        pageNo: 1,
        orderIndex: 2,
        blockType: "paragraph",
        sectionLabel: "第8节",
        headingPath: ["发布手册", "上线前检查", "第8节 上线检查"],
        text: "发布前需完成回归测试并通知相关成员。",
      },
      {
        id: "b2",
        pageNo: 1,
        orderIndex: 3,
        blockType: "paragraph",
        sectionLabel: "第8节",
        headingPath: ["发布手册", "上线前检查", "第8节 上线检查"],
        text: "发布完成后需要跟进核心指标并记录结果。",
      },
    ]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      sourceBlockId: "b1",
      pageStart: 1,
      pageEnd: 1,
      sectionLabel: "第8节",
    });
    expect(chunks[0]?.chunkText).toContain("第8节 上线检查");
    expect(chunks[0]?.chunkText).toContain("发布完成后需要跟进核心指标并记录结果");
  });

  test("starts a new chunk when the heading changes", () => {
    const chunks = buildChunkSeeds([
      {
        id: "h1",
        pageNo: 1,
        orderIndex: 1,
        blockType: "heading",
        sectionLabel: "第8节",
        headingPath: ["发布手册", "第8节 上线检查"],
        text: "第8节 上线检查",
      },
      {
        id: "b1",
        pageNo: 1,
        orderIndex: 2,
        blockType: "paragraph",
        sectionLabel: "第8节",
        headingPath: ["发布手册", "第8节 上线检查"],
        text: "上线前需完成回归测试。",
      },
      {
        id: "h2",
        pageNo: 2,
        orderIndex: 3,
        blockType: "heading",
        sectionLabel: "第9节",
        headingPath: ["发布手册", "第9节 发布后观察"],
        text: "第9节 发布后观察",
      },
      {
        id: "b2",
        pageNo: 2,
        orderIndex: 4,
        blockType: "paragraph",
        sectionLabel: "第9节",
        headingPath: ["发布手册", "第9节 发布后观察"],
        text: "发布后需要观察错误率和核心转化指标。",
      },
    ]);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.sectionLabel).toBe("第8节");
    expect(chunks[1]?.sectionLabel).toBe("第9节");
    expect(chunks[1]?.pageStart).toBe(2);
  });

  test("splits long sections while preserving the same heading metadata", () => {
    const longText = "发布前需要完成回归测试并同步相关负责人。".repeat(80);
    const chunks = buildChunkSeeds(
      [
        {
          id: "h1",
          pageNo: 3,
          orderIndex: 1,
          blockType: "heading",
          sectionLabel: "5.1",
          headingPath: ["发布流程", "5.1 发布条件"],
          text: "5.1 发布条件",
        },
        {
          id: "b1",
          pageNo: 3,
          orderIndex: 2,
          blockType: "paragraph",
          sectionLabel: "5.1",
          headingPath: ["发布流程", "5.1 发布条件"],
          text: longText.slice(0, 640),
        },
        {
          id: "b2",
          pageNo: 4,
          orderIndex: 3,
          blockType: "paragraph",
          sectionLabel: "5.1",
          headingPath: ["发布流程", "5.1 发布条件"],
          text: longText.slice(640),
        },
      ],
      { maxChars: 700 },
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.sectionLabel === "5.1")).toBe(true);
    expect(chunks.every((chunk) => chunk.headingPath.includes("5.1 发布条件"))).toBe(true);
  });
});
