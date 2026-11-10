/**
 * What the Piano still plans on a day, as rows (PL-40; change 2026-11-07-piano), for Oggi and
 * Oggi · Piano: his blocchi and the day's ciclo steps (`core/plans` `readPlanInput`,
 * `dayBlocks`) against the day's voci, then `features/day/block-items`. Server only.
 */
import type { DayItem } from "@/core/day";
import type { Db } from "@/core/db/db";
import type { DayClock, IsoDate } from "@/core/engines/time";
import type { Owner } from "@/core/identity/owner";
import { kindRegistry } from "@/core/kinds";
import { areaSlug, typeOfItem, typeSlug } from "@/core/kinds/catalog";
import { dayBlocks, readPlanInput, type CycleStepDue } from "@/core/plans";
import { blockItems, type PlanRow } from "@/features/day/block-items";
import { NAMES } from "@/features/day/words";

export async function planRows(
  db: Db,
  owner: Owner,
  p: {
    day: IsoDate;
    clock: DayClock;
    /** The day's voci, any status. */
    voci: readonly DayItem[];
    /** The day's ciclo steps (`readDayPlans`): rests and skipped ones plan nothing. */
    cycles: readonly CycleStepDue[];
    /** The minute now when the day is today; null for a day to come. */
    nowMinute: number | null;
  },
): Promise<PlanRow[]> {
  const steps = p.cycles.filter((c) => !c.rest && !c.skipped);
  const input = await readPlanInput(
    db,
    owner,
    p.day,
    p.clock,
    steps.flatMap((c) => (c.itemId ? [c.itemId] : [])),
  );
  const registry = kindRegistry();
  return blockItems({
    day: p.day,
    planned: dayBlocks({
      day: p.day,
      blocks: input.blocks,
      kindOf: (id) => input.items.get(id)?.kind ?? null,
      live: new Set([...input.items].flatMap(([id, it]) => (it.live ? [id] : []))),
      voci: p.voci.map((i) => ({
        id: i.id,
        day: p.day,
        kind: i.kind.key,
        itemId: i.item?.id ?? null,
        category: i.subcategory,
        minute: i.minute,
        status: i.status,
      })),
      history: input.history,
      steps: steps.map((c) => ({ cycleId: c.cycleId, label: c.label, itemId: c.itemId })),
    }),
    items: input.items,
    nowMinute: p.nowMinute,
    familyOf: (k) => registry.get(k).family,
    kindName: (k) => NAMES[k] ?? registry.get(k).name ?? k,
    objectOf: (catalog, id) => {
      const t = typeOfItem(catalog);
      return t
        ? { fam: t.hue, href: "/" + areaSlug(t) + "/" + typeSlug(t) + "/" + id }
        : null;
    },
  });
}
