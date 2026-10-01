/** Tests for core/assistant/crypto.ts: round trip, nonce, tampering, wrong secret. */
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

const SECRET = "test-secret-at-least-32-characters-long";

describe("encryptSecret / decryptSecret", () => {
  it("round-trips, and never repeats a ciphertext", () => {
    const a = encryptSecret("sk-or-v1-abc", SECRET);
    const b = encryptSecret("sk-or-v1-abc", SECRET);
    expect(a).not.toBe(b); // fresh nonce
    expect(a).not.toContain("sk-or");
    expect(decryptSecret(a, SECRET)).toBe("sk-or-v1-abc");
  });

  it("refuses a tampered box or another secret", () => {
    const box = encryptSecret("sk-or-v1-abc", SECRET);
    const parts = box.split(".");
    parts[3] = parts[3]!.slice(0, -2) + (parts[3]!.endsWith("A") ? "BB" : "AA");
    expect(decryptSecret(parts.join("."), SECRET)).toBeNull();
    expect(decryptSecret(box, "another-secret-another-secret-xx")).toBeNull();
    expect(decryptSecret("garbage", SECRET)).toBeNull();
  });
});
