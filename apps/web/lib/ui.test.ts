import { describe, expect, it } from "vitest";

import {
  buttonStyles,
  chipButtonStyles,
  createConversationNavButtonStyles,
  inputStyles,
  menuItemStyles,
  navItemStyles,
  textSelectionStyles,
  tabButtonStyles,
  workspaceTileStyles,
} from "./ui";

describe("inputStyles", () => {
  it("keeps the default field scale for standard forms", () => {
    expect(inputStyles()).toContain("h-11");
    expect(inputStyles()).toContain("rounded-[20px]");
  });

  it("supports a compact field scale for dense workbench layouts", () => {
    expect(inputStyles({ size: "compact" })).toContain("h-9");
    expect(inputStyles({ size: "compact" })).toContain("rounded-[16px]");
    expect(inputStyles({ size: "compact" })).toContain("focus:ring-[3px]");
  });
});

describe("buttonStyles", () => {
  it("supports an extra-small button size without custom one-off classes", () => {
    expect(buttonStyles({ size: "xs" })).toContain("min-h-7");
    expect(buttonStyles({ size: "xs" })).toContain("text-[12px]");
  });

  it("supports icon buttons through the shared button primitive", () => {
    const classes = buttonStyles({ shape: "icon", size: "sm", variant: "ghost" });

    expect(classes).toContain("size-8");
    expect(classes).toContain("p-0");
    expect(classes).toContain("rounded-xl");
  });

  it("keeps pill buttons opt-in instead of making every button fully rounded", () => {
    expect(buttonStyles()).toContain("rounded-xl");
    expect(buttonStyles({ shape: "pill" })).toContain("rounded-full");
  });

  it("supports a danger ghost variant for destructive secondary actions", () => {
    const classes = buttonStyles({ variant: "dangerGhost", size: "sm" });

    expect(classes).toContain("text-red-600");
    expect(classes).toContain("hover:bg-red-50");
  });
});

describe("navItemStyles", () => {
  it("returns the selected sidebar/navigation treatment", () => {
    const classes = navItemStyles({ selected: true });

    expect(classes).toContain("bg-white");
    expect(classes).toContain("text-app-text");
    expect(classes).toContain("shadow-soft");
  });
});

describe("createConversationNavButtonStyles", () => {
  it("uses the selected white treatment when the new conversation view is active", () => {
    const classes = createConversationNavButtonStyles({ active: true });

    expect(classes).toContain("bg-white");
    expect(classes).toContain("text-app-text");
    expect(classes).toContain("hover:bg-white");
  });

  it("keeps the button dark while browsing an existing conversation", () => {
    const classes = createConversationNavButtonStyles({ active: false });

    expect(classes).toContain("bg-app-primary");
    expect(classes).toContain("text-app-primary-contrast");
    expect(classes).not.toContain("hover:bg-app-surface-soft");
  });
});

describe("menuItemStyles", () => {
  it("returns the destructive menu treatment when requested", () => {
    const classes = menuItemStyles({ tone: "danger" });

    expect(classes).toContain("text-red-600");
    expect(classes).toContain("hover:bg-red-50");
  });

  it("supports a selected state for menu entries", () => {
    const classes = menuItemStyles({ selected: true });

    expect(classes).toContain("bg-app-surface-soft");
    expect(classes).toContain("font-medium");
    expect(classes).toContain("text-app-text");
  });
});

describe("conversation action helpers", () => {
  it("highlights active chip buttons", () => {
    const classes = chipButtonStyles({ active: true });

    expect(classes).toContain("border-app-border-strong");
    expect(classes).toContain("bg-app-surface-strong/65");
  });

  it("supports a compact chip density for dense conversation toolbars", () => {
    const classes = chipButtonStyles({ size: "compact" });

    expect(classes).toContain("px-2");
    expect(classes).toContain("py-0.5");
    expect(classes).toContain("text-[11px]");
  });

  it("keeps inactive tabs understated", () => {
    const classes = tabButtonStyles({ active: false });

    expect(classes).toContain("border-transparent");
    expect(classes).toContain("text-app-muted-strong");
  });

  it("supports compact tabs for tighter answer/source switching", () => {
    const classes = tabButtonStyles({ active: true, size: "compact" });

    expect(classes).toContain("gap-1");
    expect(classes).toContain("pb-1");
    expect(classes).toContain("text-[11px]");
  });
});

describe("workspaceTileStyles", () => {
  it("keeps standard workspace cards in a top-to-bottom information layout", () => {
    const classes = workspaceTileStyles();

    expect(classes).toContain("grid-rows-[auto_1fr_auto]");
    expect(classes).toContain("min-h-[200px]");
  });

  it("centers the create-workspace card content within the tile", () => {
    const classes = workspaceTileStyles({ variant: "create" });

    expect(classes).toContain("place-content-center");
    expect(classes).toContain("justify-items-center");
    expect(classes).toContain("text-center");
    expect(classes).toContain("border-dashed");
  });
});

describe("textSelectionStyles", () => {
  it("keeps app chrome non-selectable by default", () => {
    expect(textSelectionStyles.chrome).toBe("select-none");
  });

  it("keeps actual content explicitly selectable", () => {
    expect(textSelectionStyles.content).toBe("select-text");
  });
});
