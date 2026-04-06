// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { SettingsShell } from "./settings-shell";

describe("SettingsShell", () => {
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

  test("keeps the management shell as a true two-column frame on desktop", () => {
    act(() => {
      root.render(
        createElement(SettingsShell, {
          sidebar: createElement("div", null, "sidebar"),
          children: createElement("div", null, "content"),
        }),
      );
    });

    expect(container.textContent).toContain("sidebar");
    expect(container.textContent).toContain("content");

    const frame = container.querySelector('[data-slot="settings-shell-frame"]');
    expect(frame).toBeTruthy();
    expect(frame?.className).toContain("xl:grid-cols-[264px_minmax(0,1fr)]");

    const topRegion = container.querySelector('[data-slot="settings-shell-top"]');
    expect(topRegion).toBeTruthy();
    expect(topRegion?.className).toContain("sticky");
    expect(topRegion?.className).toContain("backdrop-blur");
  });
});
