import { describe, expect, test } from "vitest";

import { buildRetrievalTagValues } from "./index";

describe("retrieval index helpers", () => {
  test("includes document tags and doc type in retrieval tag values", () => {
    expect(
      buildRetrievalTagValues({
        docType: "contract",
        tags: ["违约责任", "不可抗力"],
        sectionLabel: "第8条",
        headingPath: ["采购主合同", "违约责任"],
        keywords: ["免责"],
      }),
    ).toEqual([
      "contract",
      "违约责任",
      "不可抗力",
      "第8条",
      "采购主合同",
      "免责",
    ]);
  });
});
