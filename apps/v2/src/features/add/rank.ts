/**
 * features/add/rank.ts — ⊕ ranks, it does not list (capture.md §5): at most
 * eight rows for «now», from what is planned today and not done yet, what is
 * usual at this hour, the routines most trained, the kinds logged in the last
 * seven days and the last meals. One thing appears once (by key), the
 * strongest reason wins. Pure.
 */
import type { BoxEntry } from "@lifeos/kit";

/** What tapping the row does: open a page, tick a planned entry done, start a routine, add water. */
export type AddAct =
  | { type: "open"; href: string }
  | { type: "done"; id: string }
  | { type: "gym"; routineId: string }
  | { type: "water"; ml: 250 | 500 };

export type AddCandidate = {
  key: string;
  entry: BoxEntry;
  act: AddAct;
  /** Why it is offered, the strongest first in the ranking. */
  reason: "planned" | "usual" | "routine" | "kind" | "recent";
  /** Within its reason: higher first (closeness to now, days used, uses). */
  weight: number;
};

export const MAX_ROWS = 8;
const ORDER: Record<AddCandidate["reason"], number> = {
  planned: 0,
  usual: 1,
  routine: 2,
  kind: 3,
  recent: 4,
};

export function rankAdd(cands: readonly AddCandidate[], max = MAX_ROWS): AddCandidate[] {
  const best = new Map<string, AddCandidate>();
  for (const c of cands) {
    const had = best.get(c.key);
    if (
      !had ||
      ORDER[c.reason] < ORDER[had.reason] ||
      (ORDER[c.reason] === ORDER[had.reason] && c.weight > had.weight)
    )
      best.set(c.key, c);
  }
  return [...best.values()]
    .sort((a, b) => ORDER[a.reason] - ORDER[b.reason] || b.weight - a.weight)
    .slice(0, max);
}

/** A planned item's weight: the closer to now, the higher (minutes apart, negated). */
export const nearNow = (minute: number | null, now: number) =>
  minute === null ? -1440 : -Math.abs(minute - now);

/** «Tutti i tipi», grouped by family (capture.md §5). */
export const GROUPS: readonly { name: string; fams: readonly string[] }[] = [
  { name: "Cibo", fams: ["food", "drink"] },
  { name: "Allenamento e movimento", fams: ["train"] },
  { name: "Corpo", fams: ["body"] },
  { name: "Sonno e mente", fams: ["sleep", "mind"] },
  { name: "Casa e soldi", fams: ["money", "home", "work", "env"] },
];

export function groupKinds<T extends { entry: BoxEntry }>(
  rows: readonly T[],
): { name: string; rows: T[] }[] {
  const out = GROUPS.map((g) => ({ name: g.name, rows: [] as T[] }));
  const own: T[] = [];
  for (const r of rows) {
    const i = GROUPS.findIndex((g) => g.fams.includes(r.entry.fam ?? ""));
    (i >= 0 ? out[i]!.rows : own).push(r);
  }
  return [...out, { name: "I tuoi", rows: own }].filter((g) => g.rows.length > 0);
}
