"use client";
/**
 * The one box of a meal (PAT-30, PAT-102; target.md B1–B2): the same on the day, on a saved
 * pasto's page and in the Elenco. Closed: the head and the strip of where its energy comes from.
 * Open (his 21 Nov, §146): only the meal's level — its four macros on one row, each bar always
 * full, showing only the proportions of its parts (its ingredients, or its kinds), each number
 * with its verdict's arrow; then one row of actions (PAT-101), then its other slots.
 */
import type { ReactNode } from "react";
import type { BoxEntry } from "./Box";
import { Nutrients } from "./Nutrients";
import { energyStrip, type NutrientsData } from "./nutrient-rows";
import { PlanBox, type PlanAction, type PlanSlot } from "./PlanBox";
import type { ThingBoxPlace } from "./ThingBox";

export function MealBox({
  entry,
  data,
  slots,
  actions = [],
  children,
  between,
  ...place
}: ThingBoxPlace & {
  entry: BoxEntry;
  /** The meal's nutrients, each ingredient a part (`foods`), each macro with its zones. */
  data: NutrientsData;
  /** Its plan's other level-1 slots (context, porzioni), from the caller. */
  slots: PlanSlot[];
  /** What can be done to it here (PAT-101). */
  actions?: PlanAction[];
  /** Open, after everything (a place's own line). */
  children?: ReactNode;
  /** Open, after the voto and above the actions (its kin, PAT-103). */
  between?: ReactNode;
}) {
  return (
    <PlanBox
      {...place}
      entry={{ ...entry, strip: energyStrip(data) }}
      slots={slots}
      actions={actions}
      before={<Nutrients data={data} part="main" chips={false} inline />}
      between={between}
    >
      {children}
    </PlanBox>
  );
}
