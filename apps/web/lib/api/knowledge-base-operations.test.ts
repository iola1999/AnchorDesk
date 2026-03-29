import { describe, expect, test } from "vitest";

import {
  buildDirectoryMovePlan,
  buildDocumentMovePlan,
  compactKnowledgeBaseSelection,
} from "./knowledge-base-operations";

describe("knowledge base operations", () => {
  test("collapses nested directory and document selections under the same subtree", () => {
    const selection = compactKnowledgeBaseSelection({
      directories: [
        { id: "dir-a", path: "资料库/项目A" },
        { id: "dir-b", path: "资料库/项目A/产品文档" },
      ],
      documents: [
        {
          id: "doc-a",
          logicalPath: "资料库/项目A/README.md",
          directoryPath: "资料库/项目A",
          sourceFilename: "README.md",
        },
        {
          id: "doc-b",
          logicalPath: "资料库/项目B/会议纪要.md",
          directoryPath: "资料库/项目B",
          sourceFilename: "会议纪要.md",
        },
      ],
    });

    expect(selection.directories).toEqual([{ id: "dir-a", path: "资料库/项目A" }]);
    expect(selection.documents).toEqual([
      {
        id: "doc-b",
        logicalPath: "资料库/项目B/会议纪要.md",
        directoryPath: "资料库/项目B",
        sourceFilename: "会议纪要.md",
      },
    ]);
  });

  test("builds subtree move plans for top-level directories", () => {
    expect(
      buildDirectoryMovePlan(
        [
          { id: "dir-a", name: "项目A", path: "资料库/项目A" },
          { id: "dir-b", name: "会议纪要", path: "资料库/项目A/会议纪要" },
        ],
        "资料库/归档",
      ),
    ).toEqual([
      {
        id: "dir-a",
        fromPath: "资料库/项目A",
        toPath: "资料库/归档/项目A",
      },
    ]);
  });

  test("rejects moving a directory into itself or its descendant", () => {
    expect(() =>
      buildDirectoryMovePlan(
        [{ id: "dir-a", name: "项目A", path: "资料库/项目A" }],
        "资料库/项目A/产品文档",
      ),
    ).toThrow("不能把目录移动到它自身或子目录中");
  });

  test("builds document move plans by preserving the filename", () => {
    expect(
      buildDocumentMovePlan(
        [
          {
            id: "doc-a",
            logicalPath: "资料库/项目A/README.md",
            directoryPath: "资料库/项目A",
            sourceFilename: "README.md",
          },
        ],
        "资料库/归档",
      ),
    ).toEqual([
      {
        id: "doc-a",
        fromLogicalPath: "资料库/项目A/README.md",
        toDirectoryPath: "资料库/归档",
        toLogicalPath: "资料库/归档/README.md",
      },
    ]);
  });
});
