/**
 * core/catalog/twins.ts — the one «Possibili doppioni» detector of an Elenco (PAT-43): two
 * objects of one type whose names are the same words once accents, case, punctuation and the
 * small words («di», «d'», «del»…) are set aside, in any order — «Burro d'arachidi» and «burro
 * di arachidi». Never a pair he said are different (`notTwins`). Pure. The food and exercise
 * detectors (features/library/twins.ts) join it in their types' changes (phase 4).
 */
const SMALL = new Set([
  "d",
  "di",
  "de",
  "del",
  "della",
  "dei",
  "e",
  "il",
  "la",
  "lo",
  "le",
  "l",
  "a",
  "al",
  "in",
  "con",
]);

/** The words a name is made of, as a key: «Burro d'arachidi» → «arachidi burro». */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((w) => w && !SMALL.has(w))
    .sort()
    .join(" ");
}

export const pairKey = (a: string, b: string) => [a, b].sort().join("|");

export function nameTwins<T extends { id: string; name: string }>(
  items: readonly T[],
  notTwins: ReadonlySet<string> = new Set(),
): [T, T][] {
  const byKey = new Map<string, T[]>();
  for (const i of items) {
    const k = nameKey(i.name);
    if (!k) continue;
    byKey.set(k, [...(byKey.get(k) ?? []), i]);
  }
  const out: [T, T][] = [];
  for (const group of byKey.values())
    for (let x = 0; x < group.length; x++)
      for (let y = x + 1; y < group.length; y++)
        if (!notTwins.has(pairKey(group[x]!.id, group[y]!.id)))
          out.push([group[x]!, group[y]!]);
  return out;
}
