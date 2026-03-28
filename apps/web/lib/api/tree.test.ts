import { describe, expect, test } from "vitest";

import { buildDocumentTree } from "./tree";

describe("buildDocumentTree", () => {
  test("builds nested directories and sorts directories before files", () => {
    const tree = buildDocumentTree([
      "资料库/项目A/产品文档/发布手册.pdf",
      "资料库/项目A/发布说明/发布清单.txt",
      "资料库/项目A/README.txt",
      "资料库/项目B/会议纪要/周会.md",
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: "资料库",
      path: "资料库",
      type: "directory",
    });

    const projectAChildren = tree[0]?.children?.[0]?.children ?? [];
    expect(projectAChildren.map((item) => item.name)).toEqual([
      "产品文档",
      "发布说明",
      "README.txt",
    ]);
    expect(projectAChildren.slice(0, 2).every((item) => item.type === "directory")).toBe(true);
    expect(projectAChildren[2]?.type).toBe("file");

    expect(projectAChildren[0]?.children?.[0]).toMatchObject({
      name: "发布手册.pdf",
      path: "资料库/项目A/产品文档/发布手册.pdf",
      type: "file",
    });
  });

  test("ignores duplicate separators in source paths", () => {
    const tree = buildDocumentTree(["/资料库//项目A///指南.pdf"]);

    expect(tree[0]?.children?.[0]?.children?.[0]).toMatchObject({
      name: "指南.pdf",
      path: "资料库/项目A/指南.pdf",
      type: "file",
    });
  });
});
