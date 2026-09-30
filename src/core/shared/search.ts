/**
 * core/shared/search.ts — the ONE search-and-rank function behind every list
 * and picker (ingredients, meals, log forms, meal editor).
 *
 * Rules, in plain words:
 *   - Case and accents don't matter: "caffe" finds "Caffè", "GNOCCHI" finds
 *     "Gnocchi". (Text is lower-cased and diacritics are stripped via Unicode
 *     NFD decomposition.)
 *   - Every word typed must appear somewhere: "pollo pat" finds "Pollo con
 *     Patate" but not "Pollo".
 *   - Better matches first: the whole text starting with the query beats a
 *     word starting with it, which beats a match in the middle of a word.
 *   - Ties, and the empty query, are ordered by how much you use the item
 *     (log entries in the last weeks), then by how recently, then A–Z. So the
 *     things you eat every day are at the top without typing anything.
 *
 * Pure and framework-free: runs on the server and in the browser (client
 * components call it on every keystroke; it's cheap at hundreds of items).
 * Tested in search.test.ts.
 */

/** Lower-case, no accents, single spaces: the form all comparisons use. */
export function normalize(s: string): string {
  return s
    .normalize("NFD") // "è" -> "e" + combining accent
    .replace(/\p{M}/gu, "") // drop the combining marks (accents)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * How well `query` matches `text`: null = no match; higher = better.
 * An empty query matches everything with score 0.
 */
export function matchScore(query: string, text: string): number | null {
  const q = normalize(query);
  if (q === "") return 0;
  const t = normalize(text);
  let score = t.startsWith(q) ? 10 : 0; // whole text starts with the query
  for (const token of q.split(" ")) {
    const at = t.indexOf(token);
    if (at === -1) return null; // every word must appear
    // Start of the text, start of a word, or inside a word.
    score += at === 0 ? 4 : t[at - 1] === " " || t[at - 1] === "(" ? 3 : 1;
  }
  return score;
}

/** What `rank` needs to know about an item. */
export type Rankable = {
  /** Searchable text, e.g. name + notes. */
  text: string;
  /** Display name, for the final A–Z tie-break. */
  name: string;
  /** How often it was used recently (0 if never). */
  uses?: number;
  /** Last day it was used, 'YYYY-MM-DD' (compares correctly as text). */
  lastUsed?: string | null;
};

/** Filters and orders `items` for `query` (see the rules in the header). */
export function rank<T>(
  items: readonly T[],
  query: string,
  describe: (item: T) => Rankable,
): T[] {
  const scored: { item: T; score: number; r: Rankable }[] = [];
  for (const item of items) {
    const r = describe(item);
    const score = matchScore(query, r.text);
    if (score !== null) scored.push({ item, score, r });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.r.uses ?? 0) - (a.r.uses ?? 0) ||
      (b.r.lastUsed ?? "").localeCompare(a.r.lastUsed ?? "") ||
      a.r.name.localeCompare(b.r.name, "it"),
  );
  return scored.map((s) => s.item);
}

/** An item a search picker can offer: what `rank` needs plus an id. */
export type Pickable = {
  id: string;
  name: string;
  /** Searched too ("Lidl", "STIMA", "senza lattosio"). */
  notes: string;
  uses: number;
  lastUsed: string | null;
};

/**
 * The `search` and `find` functions of a searchable picker (ui/SearchSelect):
 * items ranked by match then usage, each offered as { value: id, label:
 * name, hint }. Every picker in the app (add to the day, meal editor) is
 * built with this, so they all search the same way.
 */
export function pickerSearch<T extends Pickable>(
  items: readonly T[],
  hint: (item: T) => string,
) {
  const options = new Map(
    items.map((i) => [i.id, { value: i.id, label: i.name, hint: hint(i) }]),
  );
  return {
    search: (query: string) =>
      rank(items, query, (i) => ({
        text: `${i.name} ${i.notes}`,
        name: i.name,
        uses: i.uses,
        lastUsed: i.lastUsed,
      })).map((i) => options.get(i.id)!),
    find: (id: string) => options.get(id),
  };
}
