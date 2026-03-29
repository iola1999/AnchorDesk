import { describe, expect, test } from "vitest";

import {
  KNOWLEDGE_BASE_ROOT_PATH,
  buildDirectoryRecordsFromDocumentPaths,
  buildDirectoryPath,
  getDirectoryName,
  getParentDirectoryPath,
  isSameOrDescendantPath,
  normalizeDirectoryPath,
  replacePathPrefix,
} from "./directory-paths";

describe("directory path helpers", () => {
  test("normalizes directory paths and falls back to the knowledge base root", () => {
    expect(normalizeDirectoryPath("///资料库//项目A/产品文档//")).toBe(
      "资料库/项目A/产品文档",
    );
    expect(normalizeDirectoryPath("   ")).toBe(KNOWLEDGE_BASE_ROOT_PATH);
  });

  test("builds child directory paths and parent relationships", () => {
    expect(buildDirectoryPath(null, "资料库")).toBe("资料库");
    expect(buildDirectoryPath("资料库/项目A", "产品文档")).toBe(
      "资料库/项目A/产品文档",
    );
    expect(getDirectoryName("资料库/项目A/产品文档")).toBe("产品文档");
    expect(getParentDirectoryPath("资料库/项目A/产品文档")).toBe("资料库/项目A");
    expect(getParentDirectoryPath("资料库")).toBeNull();
  });

  test("derives unique directory records from document paths", () => {
    expect(
      buildDirectoryRecordsFromDocumentPaths([
        "资料库/项目A/产品文档/发布手册.pdf",
        "/资料库//项目A/发布说明/发布清单.txt",
        "资料库/项目B/会议纪要/周会.md",
      ]),
    ).toEqual([
      { name: "资料库", path: "资料库", parentPath: null },
      { name: "项目A", path: "资料库/项目A", parentPath: "资料库" },
      { name: "项目B", path: "资料库/项目B", parentPath: "资料库" },
      {
        name: "产品文档",
        path: "资料库/项目A/产品文档",
        parentPath: "资料库/项目A",
      },
      {
        name: "发布说明",
        path: "资料库/项目A/发布说明",
        parentPath: "资料库/项目A",
      },
      {
        name: "会议纪要",
        path: "资料库/项目B/会议纪要",
        parentPath: "资料库/项目B",
      },
    ]);
  });

  test("recognizes descendants and rewrites subtree paths", () => {
    expect(isSameOrDescendantPath("资料库/项目A/产品文档", "资料库/项目A")).toBe(true);
    expect(isSameOrDescendantPath("资料库/项目B", "资料库/项目A")).toBe(false);
    expect(
      replacePathPrefix(
        "资料库/项目A/产品文档/设计说明",
        "资料库/项目A",
        "资料库/项目C",
      ),
    ).toBe("资料库/项目C/产品文档/设计说明");
  });
});
