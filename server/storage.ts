// Local-disk file storage. Files are written under ENV.uploadDir and served
// through the access-controlled /manus-storage/* route (see _core/files.ts).
// The URL prefix is kept as "/manus-storage/" so document references migrated
// from the previous host keep working unchanged.

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ENV } from "./_core/env";

const URL_PREFIX = "/manus-storage";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

// Resolve a storage key to an absolute path inside the upload dir, guarding
// against path traversal (keys must stay within uploadDir).
export function resolveStoragePath(key: string): string {
  const clean = normalizeKey(key);
  const abs = path.resolve(ENV.uploadDir, clean);
  const root = path.resolve(ENV.uploadDir);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return abs;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const abs = resolveStoragePath(key);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const buffer =
    typeof data === "string" ? Buffer.from(data) : Buffer.from(data as Uint8Array);
  fs.writeFileSync(abs, buffer);
  return { key, url: `${URL_PREFIX}/${key}` };
}

export function storageExists(key: string): boolean {
  try {
    return fs.existsSync(resolveStoragePath(key));
  } catch {
    return false;
  }
}
