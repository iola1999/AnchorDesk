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
        sectionLabel: "第8条",
        headingPath: ["合同", "违约责任", "第8条 不可抗力"],
        text: "第8条 不可抗力",
      },
      {
        id: "b1",
        pageNo: 1,
        orderIndex: 2,
        blockType: "paragraph",
        sectionLabel: "第8条",
        headingPath: ["合同", "违约责任", "第8条 不可抗力"],
        text: "因地震等不可抗力导致不能履行的，受影响一方应及时通知对方。",
      },
      {
        id: "b2",
        pageNo: 1,
        orderIndex: 3,
        blockType: "paragraph",
        sectionLabel: "第8条",
        headingPath: ["合同", "违约责任", "第8条 不可抗力"],
        text: "双方应在合理期间内协商后续履行安排。",
      },
    ]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      sourceBlockId: "b1",
      pageStart: 1,
      pageEnd: 1,
      sectionLabel: "第8条",
    });
    expect(chunks[0]?.chunkText).toContain("第8条 不可抗力");
    expect(chunks[0]?.chunkText).toContain("双方应在合理期间内协商后续履行安排");
  });

  test("starts a new chunk when the heading changes", () => {
    const chunks = buildChunkSeeds([
      {
        id: "h1",
        pageNo: 1,
        orderIndex: 1,
        blockType: "heading",
        sectionLabel: "第8条",
        headingPath: ["合同", "第8条 不可抗力"],
        text: "第8条 不可抗力",
      },
      {
        id: "b1",
        pageNo: 1,
        orderIndex: 2,
        blockType: "paragraph",
        sectionLabel: "第8条",
        headingPath: ["合同", "第8条 不可抗力"],
        text: "发生不可抗力时应及时通知。",
      },
      {
        id: "h2",
        pageNo: 2,
        orderIndex: 3,
        blockType: "heading",
        sectionLabel: "第9条",
        headingPath: ["合同", "第9条 违约责任"],
        text: "第9条 违约责任",
      },
      {
        id: "b2",
        pageNo: 2,
        orderIndex: 4,
        blockType: "paragraph",
        sectionLabel: "第9条",
        headingPath: ["合同", "第9条 违约责任"],
        text: "违约方应承担守约方的全部损失。",
      },
    ]);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.sectionLabel).toBe("第8条");
    expect(chunks[1]?.sectionLabel).toBe("第9条");
    expect(chunks[1]?.pageStart).toBe(2);
  });

  test("splits long sections while preserving the same heading metadata", () => {
    const longText = "甲方应当在五个工作日内完成付款。".repeat(80);
    const chunks = buildChunkSeeds(
      [
        {
          id: "h1",
          pageNo: 3,
          orderIndex: 1,
          blockType: "heading",
          sectionLabel: "5.1",
          headingPath: ["付款条件", "5.1 付款方式"],
          text: "5.1 付款方式",
        },
        {
          id: "b1",
          pageNo: 3,
          orderIndex: 2,
          blockType: "paragraph",
          sectionLabel: "5.1",
          headingPath: ["付款条件", "5.1 付款方式"],
          text: longText.slice(0, 640),
        },
        {
          id: "b2",
          pageNo: 4,
          orderIndex: 3,
          blockType: "paragraph",
          sectionLabel: "5.1",
          headingPath: ["付款条件", "5.1 付款方式"],
          text: longText.slice(640),
        },
      ],
      { maxChars: 700 },
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.sectionLabel === "5.1")).toBe(true);
    expect(chunks.every((chunk) => chunk.headingPath.includes("5.1 付款方式"))).toBe(true);
  });
});
