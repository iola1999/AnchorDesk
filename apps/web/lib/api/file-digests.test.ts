import { describe, expect, test } from "vitest";

import { bytesToHex } from "./file-digests";

describe("file digest helpers", () => {
  test("encodes bytes as lowercase hex", () => {
    expect(bytesToHex(new Uint8Array([0, 15, 16, 255]))).toBe("000f10ff");
  });
});
