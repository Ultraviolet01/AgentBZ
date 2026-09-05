// apps/web/src/lib/key-vault.ts
// AgentBazaar encrypted API key vault
// Replaces Story Protocol CDR
// Keys encrypted with AES-256-GCM, stored in DB
// Decrypted only at runtime when buyer has valid payment

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

// Encryption key from env — must be 64 hex chars (32 bytes)
function getEncryptionKey(): Buffer {
  const keyHex = process.env.AGENTBAZAAR_VAULT_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "AGENTBAZAAR_VAULT_KEY must be set — 64 hex chars (32 bytes). " +
      "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(keyHex, "hex");
}

export interface ApiKey {
  name: string;   // e.g. "OPENAI_API_KEY"
  value: string;
}

/**
 * Encrypt API keys for storage in DB.
 * Called at agent deploy time.
 * Returns base64-encoded encrypted blob.
 */
export function encryptApiKeys(apiKeys: ApiKey[]): string {
  if (!apiKeys || apiKeys.length === 0) return "";

  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(apiKeys);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Store: iv(16) + authTag(16) + encrypted
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt API keys from DB.
 * Called at agent run time — only after Blocky402 payment verified.
 * Returns empty array if no keys stored.
 */
export function decryptApiKeys(encryptedBlob: string): ApiKey[] {
  if (!encryptedBlob) return [];

  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBlob, "base64");

  const iv = combined.subarray(0, 16);
  const authTag = combined.subarray(16, 32);
  const encrypted = combined.subarray(32);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Check if an agent has stored API keys.
 */
export function hasApiKeys(encryptedBlob: string | null): boolean {
  return !!encryptedBlob && encryptedBlob.length > 0;
}
