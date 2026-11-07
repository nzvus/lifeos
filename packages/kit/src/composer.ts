/**
 * The generic Composer's lines (PAT-62, PAT-14): what he is composing (a pasto's foods, a
 * session's exercises), each one object with a quantity in its unit. Adding an object already
 * there adds nothing (its stepper is the place to change it); the posted form is read back as
 * typed numbers, a line without a valid quantity being an error to show, never a guess.
 */
import { WORDS } from "./words";

export type ComposerLineData = { key: string; quantity: string };

export function addLine<L extends ComposerLineData>(lines: readonly L[], line: L): L[] {
  return lines.some((l) => l.key === line.key) ? [...lines] : [...lines, line];
}

export function removeLine<L extends ComposerLineData>(
  lines: readonly L[],
  key: string,
): L[] {
  return lines.filter((l) => l.key !== key);
}

export function setQuantity<L extends ComposerLineData>(
  lines: readonly L[],
  key: string,
  quantity: string,
): L[] {
  return lines.map((l) => (l.key === key ? { ...l, quantity } : l));
}

/** The posted lines: `line.N.key` and `line.N` (his decimal comma), in order. */
export function readLines(get: (name: string) => string | null): {
  lines: { key: string; quantity: number }[];
  errors: Record<string, string>;
} {
  const lines: { key: string; quantity: number }[] = [];
  const errors: Record<string, string> = {};
  for (let i = 0; ; i++) {
    const key = get(`line.${i}.key`);
    if (key === null) break;
    const raw = (get(`line.${i}`) ?? "").trim().replace(",", ".");
    const q = Number(raw);
    if (!raw || !Number.isFinite(q) || q <= 0) errors[`line.${i}`] = WORDS.form.number;
    else lines.push({ key, quantity: q });
  }
  return { lines, errors };
}

/** A line one place up (`-1`) or down (`1`); at the ends it stays. */
export function moveLine<L extends ComposerLineData>(
  lines: readonly L[],
  key: string,
  by: -1 | 1,
): L[] {
  const i = lines.findIndex((l) => l.key === key);
  const j = i + by;
  if (i < 0 || j < 0 || j >= lines.length) return [...lines];
  const out = [...lines];
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

/** The posted lines of a composer without quantities (a scheda's exercises): keys in order. */
export function readOrder(get: (name: string) => string | null): string[] {
  const keys: string[] = [];
  for (let i = 0; ; i++) {
    const key = get(`line.${i}.key`);
    if (key === null) break;
    if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}
