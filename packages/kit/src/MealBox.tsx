"use client";
/**
 * The one box of a meal (PAT-30, VIS-40; target.md B1–B2): the same on the day, on a saved
 * pasto's page and in the Elenco. Closed: the head and the strip of where its energy comes
 * from. Open: its actions row (PAT-101: the day's porzioni and the trash), the four thin
 * bars (ATT-04), `children` (the place's own actions), then its plan's slots (§132 c, §134) —
 * Cibi, Nutrienti, the context as words — drawn by `PlanBox`. The place adds; it never redraws.
 */
import type { ReactNode } from "react";
import type { BoxEntry } from "./Box";
import { NutrientsL0 } from "./Nutrients";
import { energyStrip, type NutrientsData } from "./nutrient-rows";
import { PlanBox, type PlanAction, type PlanSlot } from "./PlanBox";
import type { ThingBoxPlace } from "./ThingBox";

export function MealBox({
  entry,
  data,
  slots,
  actions,
  children,
  ...place
}: ThingBoxPlace & {
  entry: BoxEntry;
  /** Its nutrients: the strip and the four bars. */
  data: NutrientsData;
  /** Its plan's level-1 slots, in order, from the caller (`features/box/slots.ts`). */
  slots: PlanSlot[];
  /** Open, first: what can be done to it here (PAT-101). */
  actions?: PlanAction[];
  /** Open, after the bars. */
  children?: ReactNode;
}) {
  return (
    <PlanBox
      {...place}
      entry={{ ...entry, strip: energyStrip(data) }}
      slots={slots}
      {...(actions ? { actions } : {})}
    >
      <div className="k-slot-l0">
        <NutrientsL0 data={data} />
      </div>
      {children}
    </PlanBox>
  );
}
