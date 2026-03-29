import { describe, expect, test } from "vitest";

import {
  CONTENT_ADDRESSED_BLOB_PREFIX,
  buildContentAddressedStorageKey,
  isContentAddressedStorageKey,
  matchesContentAddressedStorageKey,
  normalizeSha256Hex,
} from "./object-keys";

describe("object key helpers", () => {
  test("builds a content-addressed blob key from sha256", () => {
    const key = buildContentAddressedStorageKey(
      "AABBCCDDEEFF00112233445566778899AABBCCDDEEFF00112233445566778899",
    );

    expect(key).toBe(
      `${CONTENT_ADDRESSED_BLOB_PREFIX}aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899`,
    );
    expect(isContentAddressedStorageKey(key)).toBe(true);
  });

  test("matches a content-addressed key against its sha256", () => {
    expect(
      matchesContentAddressedStorageKey(
        "blobs/aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
        "AABBCCDDEEFF00112233445566778899AABBCCDDEEFF00112233445566778899",
      ),
    ).toBe(true);
  });

  test("normalizes uppercase sha256", () => {
    expect(
      normalizeSha256Hex("AABBCCDDEEFF00112233445566778899AABBCCDDEEFF00112233445566778899"),
    ).toBe("aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899");
  });

  test("rejects invalid sha256 strings", () => {
    expect(() => buildContentAddressedStorageKey("not-a-sha")).toThrow(
      "sha256 must be a 64-character hexadecimal string",
    );
  });

  test("does not treat arbitrary keys as content-addressed blobs", () => {
    expect(isContentAddressedStorageKey("workspaces/ws-1/file.pdf")).toBe(false);
    expect(isContentAddressedStorageKey(CONTENT_ADDRESSED_BLOB_PREFIX)).toBe(false);
  });
});
