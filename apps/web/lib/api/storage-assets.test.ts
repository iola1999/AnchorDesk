import { describe, expect, test } from "vitest";

import { resolveStorageKeysToDelete } from "./storage-assets";

describe("storage asset deletion planning", () => {
  test("keeps shared blobs that are still referenced elsewhere", () => {
    expect(
      resolveStorageKeysToDelete({
        referencedStorageKeys: ["blobs/hash-a", "blobs/hash-a", "blobs/hash-b"],
        deletingStorageKeys: ["blobs/hash-a", "blobs/hash-b"],
      }),
    ).toEqual(["blobs/hash-b"]);
  });

  test("deletes a shared blob once when all remaining references belong to the same document", () => {
    expect(
      resolveStorageKeysToDelete({
        referencedStorageKeys: ["blobs/hash-a", "blobs/hash-a"],
        deletingStorageKeys: ["blobs/hash-a", "blobs/hash-a"],
      }),
    ).toEqual(["blobs/hash-a"]);
  });
});
