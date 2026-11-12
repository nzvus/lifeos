/**
 * What a ciclo's step may hold, as its Composer searches it (PAT-62, Q-18 (a)): his blocchi «nel
 * ciclo» first, then his schede (one picked becomes such a blocco when the steps are saved),
 * each said by what it is. Pure, server and client alike.
 */
import type { FindItem } from "@lifeos/kit";
import { plan } from "@/i18n/plan";

const w = plan.cycle;

/** «blocco nel ciclo» for a blocco, «scheda» for an older step's scheda; none for a rest. */
export const stepMeta = (item: { inCycle: boolean } | undefined): string | undefined =>
  item ? (item.inCycle ? w.block : w.scheda) : undefined;

export function stepCandidates(book: {
  routines: readonly { id: string; name: string }[];
  blocks: readonly { id: string; name: string }[];
}): FindItem[] {
  return [
    ...book.blocks.map((b) => ({ id: b.id, name: b.name, meta: w.block })),
    ...book.routines.map((r) => ({ id: r.id, name: r.name, meta: w.scheda })),
  ];
}
