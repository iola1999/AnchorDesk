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
      buildPdfSearchResults("上线检查", [
        { pageNo: 1, text: "第一页没有命中" },
        { pageNo: 2, text: "上线检查需要完成回归测试。" },
        { pageNo: 3, text: "上线检查还应包含通知和监控确认。" },
      ]),
    ).toEqual([
      { pageNo: 2, snippet: "上线检查需要完成回归测试。" },
      { pageNo: 3, snippet: "上线检查还应包含通知和监控确认。" },
    ]);
  });

  test("splits text into highlighted segments", () => {
    expect(splitHighlightedText("上线检查需要完成回归测试。", "上线检查")).toEqual([
      { text: "上线检查", highlighted: true },
      { text: "需要完成回归测试。", highlighted: false },
    ]);
  });
});
