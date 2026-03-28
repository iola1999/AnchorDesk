import { describe, expect, it } from "vitest";

import { validateDisplayNameInput } from "./display-name";

describe("validateDisplayNameInput", () => {
  it("accepts a valid payload and trims it", () => {
    const result = validateDisplayNameInput({
      displayName: "  新显示名称  ",
    });

    expect(result.success).toBe(true);
    expect(result.data?.displayName).toBe("新显示名称");
  });

  it("rejects an empty display name", () => {
    const result = validateDisplayNameInput({
      displayName: "   ",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("显示名称不能为空。");
  });

  it("rejects a display name longer than 120 characters", () => {
    const result = validateDisplayNameInput({
      displayName: "a".repeat(121),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("显示名称不能超过 120 个字符。");
  });
});
