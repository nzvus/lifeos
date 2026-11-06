/**
 * Ids for the rows the converter makes (migration.md). A v1 row that becomes
 * one v2 row keeps its id, so a v2 row can be traced back. A row v1 did not
 * have (a value, a format, a block) gets a name-based UUID (version 5): the
 * same export always converts to the same file, so a re-run diffs cleanly.
 * The refined copy's `_v2` ids are made the same way.
 */
import { createHash } from "node:crypto";

/** lifeos v2's namespace for derived ids (a fixed random UUID). */
const NAMESPACE = "6f1d4b0e-6a39-4c55-9a56-8c2f7e0b3d21";

export function idFor(...parts: readonly (string | number)[]): string {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const h = createHash("sha1").update(ns).update(parts.join("\u0000")).digest();
  h[6] = (h[6]! & 0x0f) | 0x50; // version 5
  h[8] = (h[8]! & 0x3f) | 0x80; // RFC 4122 variant
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}
