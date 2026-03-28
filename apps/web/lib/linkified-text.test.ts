import { describe, expect, test } from "vitest";

import { tokenizeTextWithLinks } from "./linkified-text";

describe("tokenizeTextWithLinks", () => {
  test("keeps plain text untouched", () => {
    expect(tokenizeTextWithLinks("没有链接")).toEqual([
      {
        type: "text",
        value: "没有链接",
      },
    ]);
  });

  test("extracts raw urls without trailing punctuation", () => {
    expect(tokenizeTextWithLinks("见 https://example.com/test).")).toEqual([
      {
        type: "text",
        value: "见 ",
      },
      {
        type: "link",
        href: "https://example.com/test",
        label: "https://example.com/test",
      },
      {
        type: "text",
        value: ").",
      },
    ]);
  });

  test("extracts markdown links", () => {
    expect(
      tokenizeTextWithLinks("外部资料：[项目主页](https://example.com/docs)"),
    ).toEqual([
      {
        type: "text",
        value: "外部资料：",
      },
      {
        type: "link",
        href: "https://example.com/docs",
        label: "项目主页",
      },
    ]);
  });
});
