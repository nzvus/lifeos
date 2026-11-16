"use client";
/**
 * The one box of a meal (PAT-30, VIS-40; target.md B1–B2): the same on the day, on a saved
 * pasto's page and in the Elenco. Closed: the head and the strip of where its energy comes
 * from. Open: `top` (the place's own line: the day's porzioni and «Elimina»), the four thin
 * bars, `children` (the place's own actions: «Registra», «Apri»), then the doors — «Voto» from
 * its score, Nutrienti, Cibi, Costo — one panel at a time. The place adds; it never redraws.
 */
import { useState, type ReactNode } from "react";
import { Box, type BoxAct, type BoxEntry } from "./Box";
import { mealDoors, type BoxDetails, type DoorWords } from "./meal-doors";
import { NutrientsL0 } from "./Nutrients";
import { energyStrip, type NutrientsData } from "./nutrient-rows";

export function MealBox({
  entry,
  data,
  labels,
  details,
  foods,
  top,
  children,
  startOpen = false,
  density,
  rail = false,
  mode,
  onRail,
  acts,
}: {
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
  /** Alone on its own page (PAT-30 level 2): open at first. */
  startOpen?: boolean;
  density?: "card" | "row";
  rail?: boolean;
  mode?: "compact" | "times";
  onRail?: () => void;
  acts?: BoxAct[];
}) {
  const [open, setOpen] = useState(startOpen);
  // One door open at a time; a second tap on it shuts it («Oggi a livelli»).
  const [door, setDoor] = useState<string | null>(null);
  return (
    <Box
      entry={{ ...entry, strip: energyStrip(data) }}
      rail={rail}
      {...(density ? { density } : {})}
      {...(mode ? { mode } : {})}
      {...(onRail ? { onRail } : {})}
      {...(acts ? { acts } : {})}
      expanded={open}
      onToggle={() => setOpen((o) => !o)}
      doors={mealDoors(data, details, foods, labels)}
      door={door}
      onDoor={(k: string) => setDoor((d) => (d === k ? null : k))}
    >
      {top}
      <div className="k-slot-l0">
        <NutrientsL0 data={data} />
      </div>
      {children}
    </Box>
  );
}
