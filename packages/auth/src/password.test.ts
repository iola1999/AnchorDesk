import { describe, expect, test } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
  test("hashes and verifies a valid password", async () => {
    const hash = await hashPassword("S3cure-Passw0rd");

    expect(hash).not.toBe("S3cure-Passw0rd");
    await expect(verifyPassword("S3cure-Passw0rd", hash)).resolves.toBe(true);
  });

  test("rejects an invalid password", async () => {
    const hash = await hashPassword("correct-password");

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
