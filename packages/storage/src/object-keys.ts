import { randomUUID } from "node:crypto";

export const TEMP_UPLOAD_PREFIX = "pending/";
export const CONTENT_ADDRESSED_BLOB_PREFIX = "blobs/";

export function normalizeSha256Hex(sha256: string) {
  const normalized = sha256.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error("sha256 must be a 64-character hexadecimal string");
  }

  return normalized;
}

export function buildTemporaryUploadKey() {
  return `${TEMP_UPLOAD_PREFIX}${randomUUID()}`;
}

export function isTemporaryUploadKey(key: string) {
  return key.startsWith(TEMP_UPLOAD_PREFIX) && key.length > TEMP_UPLOAD_PREFIX.length;
}

export function buildContentAddressedStorageKey(sha256: string) {
  return `${CONTENT_ADDRESSED_BLOB_PREFIX}${normalizeSha256Hex(sha256)}`;
}

export function isContentAddressedStorageKey(key: string) {
  return key.startsWith(CONTENT_ADDRESSED_BLOB_PREFIX) &&
    key.length === CONTENT_ADDRESSED_BLOB_PREFIX.length + 64;
}

export function matchesContentAddressedStorageKey(key: string, sha256: string) {
  return key === buildContentAddressedStorageKey(sha256);
}
