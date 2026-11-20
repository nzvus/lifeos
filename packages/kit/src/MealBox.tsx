"use client";
/**
 * The one box of a meal (PAT-30, VIS-40; target.md B1–B2): the same on the day, on a saved
 * pasto's page and in the Elenco. Closed: the head and the strip of where its energy comes
 * from. Open: `top` (the place's own line: the day's porzioni and «Elimina»), the four thin
 * bars, `children` (the place's own actions: «Registra», «Apri»), then the doors — «Voto» from
 * its score, Nutrienti, Cibi, Costo — one panel at a time. The place adds; it never redraws.
 * It is `ThingBox` with a meal's doors (Deliver ③).
 */
import type { ReactNode } from "react";
import type { BoxEntry } from "./Box";
import { mealDoors, type BoxDetails, type DoorWords } from "./meal-doors";
import { NutrientsL0 } from "./Nutrients";
import { energyStrip, type NutrientsData } from "./nutrient-rows";
import { ThingBox, type ThingBoxPlace } from "./ThingBox";

export function MealBox({
  entry,
  data,
  labels,
  details,
  foods,
  top,
  children,
  ...place
}: ThingBoxPlace & {
  entry: BoxEntry;
  /** Its nutrients: the strip, the four bars, the «Nutrienti» door. */
  data: NutrientsData;
  /** The doors' words (PAT-81); the cost is the tile of `details` named `labels.cost`. */
  labels: DoorWords;
  /** Its cibi as lines, its cost and the rest as tiles. */
  details?: BoxDetails | null;
  /** The «Cibi» panel when the place has more to say than amounts (rows that open a cibo). */
  foods?: ReactNode;
  /** Open, before the bars. */
  top?: ReactNode;
  /** Open, after the bars. */
  children?: ReactNode;
}) {
  return (
    <ThingBox
      {...place}
      entry={{ ...entry, strip: energyStrip(data) }}
      doors={mealDoors(data, details, foods, labels)}
    >
      {top}
      <div className="k-slot-l0">
        <NutrientsL0 data={data} />
      </div>
      {children}
    </ThingBox>
  );
}
