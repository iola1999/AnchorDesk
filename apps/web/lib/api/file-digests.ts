function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function computeFileSha256(file: Blob) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("当前浏览器不支持 SHA-256 指纹计算");
  }

  const buffer = await file.arrayBuffer();
  const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
  return bytesToHex(new Uint8Array(digest));
}

export { bytesToHex };
