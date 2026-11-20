/**
 * A thing's doors from its type's plan (Deliver ③; PAT-30, VIS-40): the level-1 slots of
 * `boxPlan`, in the plan's order, each drawn by what the place supplies for it. The voto is the
 * Box's own first door (from `entry.score`), so it is never supplied here. A slot the place has
 * no data for is left out (PRD-22: never invent). Shared by every place that shows a thing.
 */
import type { BoxDoor } from "@lifeos/kit";
import { boxPlan } from "@/core/engines/view";

export type Supplied = Partial<Record<string, Omit<BoxDoor, "key">>>;

export function planDoors(type: string, supplied: Supplied): BoxDoor[] {
  return boxPlan(type).open.flatMap((x) => {
    const d = supplied[x.key];
    return d ? [{ key: x.key, ...d }] : [];
  });
}

/** The slot keys of a type's open level a place has not supplied: what its box still lacks. */
export function missingDoors(type: string, supplied: Supplied): string[] {
  return boxPlan(type)
    .open.filter((x) => x.key !== "score" && !supplied[x.key])
    .map((x) => x.key);
}
