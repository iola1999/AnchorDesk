import { describe, expect, it } from "vitest";

import { validateChangePasswordInput } from "./password-change";

describe("validateChangePasswordInput", () => {
  it("accepts a valid password change payload", () => {
    const result = validateChangePasswordInput({
      currentPassword: "old-password",
      nextPassword: "new-password",
      confirmPassword: "new-password",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a short next password", () => {
    const result = validateChangePasswordInput({
      currentPassword: "old-password",
      nextPassword: "123",
      confirmPassword: "123",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("新密码至少 6 位。");
  });

  it("rejects when the next password matches the current password", () => {
    const result = validateChangePasswordInput({
      currentPassword: "same-password",
      nextPassword: "same-password",
      confirmPassword: "same-password",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("新密码不能与当前密码相同。");
  });

  it("rejects when confirmation does not match", () => {
    const result = validateChangePasswordInput({
      currentPassword: "old-password",
      nextPassword: "new-password",
      confirmPassword: "different-password",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("两次输入的新密码不一致。");
  });
});
