import { describe, expect, it } from "vitest";

import { canSubmitDialogText, normalizeDialogText } from "./dialog";

describe("normalizeDialogText", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeDialogText("  发布节奏复盘  ")).toBe("发布节奏复盘");
  });
});

describe("canSubmitDialogText", () => {
  it("rejects empty values after trimming", () => {
    expect(canSubmitDialogText({ value: "   " })).toBe(false);
  });

  it("treats whitespace-only edits as unchanged when change is required", () => {
    expect(
      canSubmitDialogText({
        value: "  当前会话标题  ",
        initialValue: "当前会话标题",
        requireChange: true,
      }),
    ).toBe(false);
  });

  it("allows meaningful changes", () => {
    expect(
      canSubmitDialogText({
        value: "新的会话标题",
        initialValue: "当前会话标题",
        requireChange: true,
      }),
    ).toBe(true);
  });
});
