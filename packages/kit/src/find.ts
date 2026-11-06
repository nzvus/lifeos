/**
 * Find (PAT-41): one matcher for every search — accents folded, aliases, one typo in a word
 * of four letters or more — and one ranking: what he usually takes at this hour, then the most used, then the
 * name. Pure; replaces the 4 matchers and 3 `fold`s of 6 Nov (audit README §2).
 */
export type Findable = {
  id: string;
  name: string;
  aliases?: readonly string[];
  /** Times used in all. */
  uses?: number;
  /** Hours of the day (0–23) it was used at, one per use, recent first. */
  hours?: readonly number[];
  /** The filter chips it belongs to. */
  tags?: readonly string[];
};

/** «Caffè» and «caffe» are the same word to a search. */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/** Edits between two words, stopping past `max` (Damerau: a swap counts one). */
export function distance(a: string, b: string, max = 1): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  return d[a.length]![b.length]!;
}

/** A typed word matches a name's word: its start, or one typo in a word of 4 letters or more. */
const wordMatches = (typed: string, word: string) =>
  word.startsWith(typed) ||
  (typed.length >= 4 && distance(typed, word.slice(0, typed.length + 1)) <= 1) ||
  (typed.length >= 4 && distance(typed, word) <= 1);

/** 0 = no match; 3 = the name starts with it; 2 = every word matches; 1 = through an alias. */
export function matchScore(query: string, item: Findable): number {
  const typed = fold(query).split(/\s+/).filter(Boolean);
  if (typed.length === 0) return 1;
  const score = (text: string) => {
    const f = fold(text);
    if (f.startsWith(typed.join(" "))) return 3;
    const words = f.split(/[\s,.'’()/-]+/).filter(Boolean);
    return typed.every((t) => words.some((w) => wordMatches(t, w)) || f.includes(t))
      ? 2
      : 0;
  };
  const own = score(item.name);
  if (own) return own;
  return (item.aliases ?? []).some((a) => score(a) > 0) ? 1 : 0;
}

/** Uses at this hour, ±1 h: «di solito a quest'ora». */
export const usesAtHour = (item: Findable, hour: number) =>
  (item.hours ?? []).filter(
    (h) => Math.min(Math.abs(h - hour), 24 - Math.abs(h - hour)) <= 1,
  ).length;

/** The items that match, best first; with nothing typed, the ones he uses (habit, then use). */
export function find<T extends Findable>(
  items: readonly T[],
  query: string,
  opts: { hour: number; tag?: string | null; all?: boolean } = { hour: 12 },
): T[] {
  // `all`: with nothing typed, every item (a short choice, «Unisci»), not only the habitual ones.
  const typed = fold(query).length > 0 || !!opts.all;
  return items
    .filter((i) => !opts.tag || (i.tags ?? []).includes(opts.tag))
    .map((i) => ({ i, m: matchScore(query, i) }))
    .filter(({ i, m }) => m > 0 && (typed || (i.uses ?? 0) > 0))
    .sort(
      (a, b) =>
        b.m - a.m ||
        usesAtHour(b.i, opts.hour) - usesAtHour(a.i, opts.hour) ||
        (b.i.uses ?? 0) - (a.i.uses ?? 0) ||
        a.i.name.localeCompare(b.i.name, "it"),
    )
    .map(({ i }) => i);
}
