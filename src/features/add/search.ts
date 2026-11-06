/**
 * features/add/search.ts — ⊕'s one search (V-02, the board Capture): the
 * kinds this person can enter, their foods, saved meals and routines, as
 * one list of targets; a query keeps those whose words all appear, a name
 * starting with it first, then kinds, foods, meals, routines. Pure.
 */
import type { GlyphOf } from "@lifeos/kit";
import { fold } from "@/core/food/choices";

export type AddTarget = {
  key: string;
  title: string;
  /** What it is, in words: «tipo», «cibo», «pasto salvato», «allenamento». */
  sub: string;
  fam: string;
  of?: GlyphOf;
  href: string;
};

const ORDER = ["tipo", "cibo", "pasto salvato", "allenamento"];

export function searchTargets(
  targets: readonly AddTarget[],
  query: string,
  limit = 12,
): AddTarget[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const rank = (t: AddTarget) =>
    (fold(t.title).startsWith(words[0]!) ? 0 : 10) + ORDER.indexOf(t.sub);
  return targets
    .filter((t) => words.every((w) => fold(t.title + " " + t.sub).includes(w)))
    .sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, "it"))
    .slice(0, limit);
}
