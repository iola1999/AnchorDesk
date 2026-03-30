// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { LinkifiedText } from "../components/shared/linkified-text";

describe("LinkifiedText", () => {
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

  test("keeps rendered content selectable while preserving linkification", () => {
    act(() => {
      root.render(
        createElement(LinkifiedText, {
          text: "参考 https://example.com/docs",
        }),
      );
    });

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("select-text");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://example.com/docs");
  });
});
