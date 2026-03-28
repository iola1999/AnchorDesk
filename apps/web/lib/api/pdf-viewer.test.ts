import { describe, expect, test } from "vitest";

import {
  buildPdfSearchResults,
  resolveInitialPdfPage,
  splitHighlightedText,
} from "./pdf-viewer";

describe("pdf viewer helpers", () => {
  test("prefers the highlighted anchor page and clamps to the valid range", () => {
    expect(
      resolveInitialPdfPage({
        highlightedAnchorPage: 12,
        requestedPage: 3,
        totalPages: 8,
      }),
    ).toBe(8);
    expect(
      resolveInitialPdfPage({
        highlightedAnchorPage: undefined,
        requestedPage: 0,
        totalPages: 8,
      }),
    ).toBe(1);
  });

  test("builds search results from matching page text", () => {
    expect(
      buildPdfSearchResults("不可抗力", [
        { pageNo: 1, text: "第一页没有命中" },
        { pageNo: 2, text: "发生不可抗力时应及时通知。" },
        { pageNo: 3, text: "不可抗力免责以法定范围为限。" },
      ]),
    ).toEqual([
      { pageNo: 2, snippet: "发生不可抗力时应及时通知。" },
      { pageNo: 3, snippet: "不可抗力免责以法定范围为限。" },
    ]);
  });

  test("splits text into highlighted segments", () => {
    expect(splitHighlightedText("发生不可抗力时应及时通知。", "不可抗力")).toEqual([
      { text: "发生", highlighted: false },
      { text: "不可抗力", highlighted: true },
      { text: "时应及时通知。", highlighted: false },
    ]);
  });
});
