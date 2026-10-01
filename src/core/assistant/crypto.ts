/**
 * core/assistant/crypto.ts — the user's OpenRouter key at rest (ADR-0018):
 * AES-256-GCM, a fresh 12-byte nonce per encryption, the key derived from
 * the server secret with SHA-256. Stored as "v1.<nonce>.<tag>.<data>"
 * (base64url), so a future scheme can be told apart. The secret is passed
 * in (app/_server reads ASSISTANT_KEY_SECRET); core never reads env.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const keyOf = (secret: string) => createHash("sha256").update(secret, "utf8").digest();

export function encryptSecret(plain: string, secret: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyOf(secret), nonce);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", nonce, tag, data]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
}

/** The plain text, or null if the box was tampered with or the secret changed. */
export function decryptSecret(box: string, secret: string): string | null {
  const [v, nonce, tag, data] = box.split(".");
  if (v !== "v1" || !nonce || !tag || !data) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      keyOf(secret),
      Buffer.from(nonce, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
