// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { MarkdownContent } from "../components/shared/markdown-content";

describe("MarkdownContent", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  test("renders markdown structure instead of plain text", () => {
    act(() => {
      root.render(
        createElement(MarkdownContent, {
          content: "# 标题\n\n- 条目一\n- 条目二\n\n```ts\nconst a = 1;\n```",
        }),
      );
    });

    expect(container.querySelector(".app-markdown")?.className).toContain("select-text");
    expect(container.querySelector("h1")?.textContent).toBe("标题");
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelector("pre code")?.textContent).toContain("const a = 1;");
  });

  test("keeps external links safe", () => {
    act(() => {
      root.render(
        createElement(MarkdownContent, {
          content: "[项目主页](https://example.com/docs)",
        }),
      );
    });

    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com/docs");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
