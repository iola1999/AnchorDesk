import { describe, expect, test } from "vitest";

import { buildDocumentTree } from "./tree";

describe("buildDocumentTree", () => {
  test("builds nested directories and sorts directories before files", () => {
    const tree = buildDocumentTree([
      "资料库/客户A/主合同/采购主合同.pdf",
      "资料库/客户A/补充协议/补充协议一.pdf",
      "资料库/客户A/README.txt",
      "资料库/客户B/证据/邮件.eml",
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({
      name: "资料库",
      path: "资料库",
      type: "directory",
    });

    const customerAChildren = tree[0]?.children?.[0]?.children ?? [];
    expect(customerAChildren.map((item) => item.name)).toEqual([
      "补充协议",
      "主合同",
      "README.txt",
    ]);
    expect(customerAChildren.slice(0, 2).every((item) => item.type === "directory")).toBe(true);
    expect(customerAChildren[2]?.type).toBe("file");

    expect(customerAChildren[1]?.children?.[0]).toMatchObject({
      name: "采购主合同.pdf",
      path: "资料库/客户A/主合同/采购主合同.pdf",
      type: "file",
    });
  });

  test("ignores duplicate separators in source paths", () => {
    const tree = buildDocumentTree(["/资料库//客户A///合同.pdf"]);

    expect(tree[0]?.children?.[0]?.children?.[0]).toMatchObject({
      name: "合同.pdf",
      path: "资料库/客户A/合同.pdf",
      type: "file",
    });
  });
});
