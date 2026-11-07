/**
 * features/add/search.ts — ⊕'s targets (PAT-60): the kinds he can enter, his foods, saved meals
 * and routines, each a door (`href`), as rows of the kit's one search (`Find`, PAT-41: one
 * matcher for every search). Pure.
 */
import type { FindItem, GlyphOf } from "@lifeos/kit";

export type AddTarget = {
  key: string;
  title: string;
  /** What it is, in words: «tipo», «cibo», «pasto salvato», «allenamento». */
  sub: string;
  fam: string;
  of?: GlyphOf;
  href: string;
};

export type AddRow = FindItem & { href: string };

/** Each target as a `Find` row: its name, what it is beside it (and found by it), its door. */
export const findTargets = (targets: readonly AddTarget[]): AddRow[] =>
  targets.map((t) => ({
    id: t.key,
    name: t.title,
    aliases: [t.sub],
    meta: t.sub,
    href: t.href,
  }));
