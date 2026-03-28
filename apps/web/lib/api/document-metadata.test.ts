import { describe, expect, test } from "vitest";

import {
  buildDocumentMetadataUpdate,
  buildDocumentPath,
  buildStoredFilename,
  normalizeDocumentTags,
} from "./document-metadata";

describe("document metadata helpers", () => {
  test("renames a document while preserving the existing extension", () => {
    expect(buildStoredFilename("补充协议-修订稿", "补充协议.docx")).toBe(
      "补充协议-修订稿.docx",
    );
    expect(buildStoredFilename("补充协议-修订稿.docx", "补充协议.docx")).toBe(
      "补充协议-修订稿.docx",
    );
  });

  test("normalizes tags by trimming whitespace and removing duplicates", () => {
    expect(
      normalizeDocumentTags([" 违约责任 ", "不可抗力", "违约责任", "", "  "]),
    ).toEqual(["违约责任", "不可抗力"]);
  });

  test("normalizes directory paths and rebuilds the logical path", () => {
    expect(buildDocumentPath("///资料库//客户A/主合同//", "采购主合同.pdf")).toBe(
      "资料库/客户A/主合同/采购主合同.pdf",
    );
  });

  test("builds a metadata update for rename, move, type, and tags", () => {
    const next = buildDocumentMetadataUpdate(
      {
        title: "采购主合同",
        sourceFilename: "采购主合同.pdf",
        directoryPath: "资料库/客户A/旧目录",
        logicalPath: "资料库/客户A/旧目录/采购主合同.pdf",
        docType: "contract",
        tags: ["违约责任"],
      },
      {
        title: "采购主合同-修订稿",
        directoryPath: "/资料库/客户A/主合同/",
        docType: "memo",
        tags: [" 不可抗力 ", "违约责任", "不可抗力"],
      },
    );

    expect(next).toEqual({
      title: "采购主合同-修订稿",
      sourceFilename: "采购主合同-修订稿.pdf",
      directoryPath: "资料库/客户A/主合同",
      logicalPath: "资料库/客户A/主合同/采购主合同-修订稿.pdf",
      docType: "memo",
      tags: ["不可抗力", "违约责任"],
      pathChanged: true,
      metadataChanged: true,
      searchPayloadChanged: true,
    });
  });

  test("does not mark metadata as changed when the patch is equivalent", () => {
    const next = buildDocumentMetadataUpdate(
      {
        title: "采购主合同",
        sourceFilename: "采购主合同.pdf",
        directoryPath: "资料库",
        logicalPath: "资料库/采购主合同.pdf",
        docType: "contract",
        tags: ["违约责任"],
      },
      {
        title: "采购主合同",
        directoryPath: "/资料库/",
        docType: "contract",
        tags: ["违约责任", "违约责任"],
      },
    );

    expect(next.metadataChanged).toBe(false);
    expect(next.pathChanged).toBe(false);
    expect(next.searchPayloadChanged).toBe(false);
  });
});
