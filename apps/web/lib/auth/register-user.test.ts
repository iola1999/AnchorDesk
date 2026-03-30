import { describe, expect, test, vi } from "vitest";

import { registerUser } from "./register-user";

describe("registerUser", () => {
  test("marks the first successfully registered user as super admin", async () => {
    const usernameExists = vi.fn().mockResolvedValue(false);
    const superAdminExists = vi.fn().mockResolvedValue(false);
    const insertUser = vi.fn().mockResolvedValue({
      id: "user-1",
      username: "founder",
      isSuperAdmin: true,
    });

    const result = await registerUser(
      {
        username: "founder",
        passwordHash: "hashed-password",
        displayName: "Founder",
      },
      {
        usernameExists,
        superAdminExists,
        insertUser,
      },
    );

    expect(result).toEqual({
      ok: true,
      user: {
        id: "user-1",
        username: "founder",
        isSuperAdmin: true,
      },
    });
    expect(insertUser).toHaveBeenCalledWith({
      username: "founder",
      passwordHash: "hashed-password",
      displayName: "Founder",
      isSuperAdmin: true,
    });
  });

  test("registers later users without the super-admin flag", async () => {
    const result = await registerUser(
      {
        username: "member",
        passwordHash: "hashed-password",
        displayName: "Member",
      },
      {
        usernameExists: vi.fn().mockResolvedValue(false),
        superAdminExists: vi.fn().mockResolvedValue(true),
        insertUser: vi.fn().mockResolvedValue({
          id: "user-2",
          username: "member",
          isSuperAdmin: false,
        }),
      },
    );

    expect(result).toEqual({
      ok: true,
      user: {
        id: "user-2",
        username: "member",
        isSuperAdmin: false,
      },
    });
  });

  test("retries without super-admin privileges when another registration wins the race", async () => {
    const usernameExists = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    const insertUser = vi
      .fn()
      .mockRejectedValueOnce({ code: "23505" })
      .mockResolvedValueOnce({
        id: "user-2",
        username: "member",
        isSuperAdmin: false,
      });

    const result = await registerUser(
      {
        username: "member",
        passwordHash: "hashed-password",
        displayName: "Member",
      },
      {
        usernameExists,
        superAdminExists: vi.fn().mockResolvedValue(false),
        insertUser,
      },
    );

    expect(result).toEqual({
      ok: true,
      user: {
        id: "user-2",
        username: "member",
        isSuperAdmin: false,
      },
    });
    expect(insertUser).toHaveBeenNthCalledWith(1, {
      username: "member",
      passwordHash: "hashed-password",
      displayName: "Member",
      isSuperAdmin: true,
    });
    expect(insertUser).toHaveBeenNthCalledWith(2, {
      username: "member",
      passwordHash: "hashed-password",
      displayName: "Member",
      isSuperAdmin: false,
    });
  });

  test("returns a duplicate-username result when the username already exists", async () => {
    const insertUser = vi.fn();

    const result = await registerUser(
      {
        username: "member",
        passwordHash: "hashed-password",
        displayName: "Member",
      },
      {
        usernameExists: vi.fn().mockResolvedValue(true),
        superAdminExists: vi.fn(),
        insertUser,
      },
    );

    expect(result).toEqual({
      ok: false,
      reason: "username_exists",
    });
    expect(insertUser).not.toHaveBeenCalled();
  });
});
