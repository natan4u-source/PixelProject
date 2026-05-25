import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { isProduction } from "./env";

const ALGORITHM = "aes-256-gcm";
const MAGIC = Buffer.from("PXLVLT1");
const SALT = "pixel-project-master-v1";

function getEncryptionKey() {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY?.trim();
  const adminSecret = process.env.ADMIN_SECRET?.trim();

  if (isProduction()) {
    if (!masterKey) {
      throw new Error(
        "Set MASTER_ENCRYPTION_KEY in production (must be separate from ADMIN_SECRET).",
      );
    }
    return scryptSync(masterKey, SALT, 32);
  }

  const secret = masterKey || adminSecret;
  if (!secret) {
    throw new Error(
      "Set MASTER_ENCRYPTION_KEY or ADMIN_SECRET to encrypt the hidden image.",
    );
  }
  return scryptSync(secret, SALT, 32);
}

export function encryptMasterPng(pngBuffer: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(pngBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, encrypted]);
}

export function decryptMasterVault(vaultBuffer: Buffer): Buffer {
  if (vaultBuffer.length < MAGIC.length + 12 + 16 + 1) {
    throw new Error("Invalid master vault file.");
  }

  const magic = vaultBuffer.subarray(0, MAGIC.length);
  if (!magic.equals(MAGIC)) {
    throw new Error("Invalid master vault format.");
  }

  const iv = vaultBuffer.subarray(MAGIC.length, MAGIC.length + 12);
  const tag = vaultBuffer.subarray(MAGIC.length + 12, MAGIC.length + 28);
  const encrypted = vaultBuffer.subarray(MAGIC.length + 28);

  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function isPngBuffer(buffer: Buffer) {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  );
}
