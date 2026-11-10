/**
 * A blocco Composer's line keys (PL-01, PL-03): an object's line is its id, a type's
 * `kind:<key>`. Pure: read by the page and by its action.
 */
import type { BlockWhatInput } from "@/core/plans";

export const KIND_KEY = "kind:";

/** The posted lines as what the blocco holds: one type alone, or its objects; null if mixed. */
export function whatOf(
  lines: readonly { key: string; quantity: number }[],
): BlockWhatInput | null {
  const kinds = lines.filter((l) => l.key.startsWith(KIND_KEY));
  if (kinds.length === 0)
    return lines.length
      ? { items: lines.map((l) => ({ id: l.key, quantity: l.quantity })) }
      : null;
  return kinds.length === 1 && lines.length === 1
    ? { kind: kinds[0]!.key.slice(KIND_KEY.length) }
    : null;
}
