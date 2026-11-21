"use client";
/**
 * The one box of a meal (PAT-30, PAT-102; target.md B1–B2): the same on the day, on a saved
 * pasto's page and in the Elenco. Closed: the head and the strip of where its energy comes from.
 * Open (his 21 Nov, §146): only the meal's level — its four macros on one row, each bar always
 * full, showing only the proportions of its parts (its ingredients, or its kinds), each number
 * with its verdict's arrow; then one row of actions (PAT-101), then its other slots.
 */
import { useState, type ReactNode } from "react";
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
  ingredients,
  words = { foods: "Ingredienti", kinds: "Nutrienti" },
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
  /** The «Ingredienti» band's content (its foods, edited in place, §169); none: no two halves. */
  ingredients?: ReactNode;
  /** The two halves' words, from the caller (PAT-81). */
  words?: { foods: string; kinds: string };
}) {
  // One view for the bars and the last band (his §170): a tap on the bars switches it, the band
  // follows; a tap on a half shows that view and opens or shuts its band.
  const [view, setView] = useState<"foods" | "kinds">("foods");
  const [open, setOpen] = useState(false);
  return (
    <PlanBox
      {...place}
      entry={{ ...entry, strip: energyStrip(data) }}
      slots={slots}
      actions={actions}
      before={
        <Nutrients
          data={data}
          part="main"
          chips={false}
          inline
          by={view}
          {...(ingredients
            ? { onTap: () => setView((v) => (v === "foods" ? "kinds" : "foods")) }
            : {})}
        />
      }
      between={between}
      {...(ingredients
        ? {
            xor: {
              items: [
                { key: "kinds", label: words.kinds },
                { key: "foods", label: words.foods },
              ],
              current: view,
              open,
              onPick: (k: string) => {
                if (k === view) setOpen((o) => !o);
                else {
                  setView(k as "foods" | "kinds");
                  setOpen(true);
                }
              },
              panel:
                view === "foods" ? (
                  ingredients
                ) : (
                  <Nutrients data={data} chips={false} by="kinds" />
                ),
            },
          }
        : {})}
    >
      {children}
    </PlanBox>
  );
}
