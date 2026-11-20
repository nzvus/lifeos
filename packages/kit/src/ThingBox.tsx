"use client";
/**
 * The Box of any thing that opens in place (PAT-30 level 1, VIS-40; Deliver ③): the caller gives
 * the head and the doors its type's plan says (`core/engines/view/box.ts`), this holds the state —
 * open or shut, one door at a time — so every voce, object and obiettivo opens the same way. A
 * tap anywhere opens it, its head closes it, «Apri» inside it leads to its page (PAT-30 level 2).
 * `MealBox` is this with a meal's doors.
 */
import { useState, type ReactNode } from "react";
import { Box, type BoxAct, type BoxDoor, type BoxEntry } from "./Box";

/** How and where the Box sits: the same for every thing (a place passes these through). */
export type ThingBoxPlace = {
  /** Alone on its own page (PAT-30 level 2): open at first. */
  startOpen?: boolean;
  density?: "card" | "row";
  rail?: boolean;
  mode?: "compact" | "times";
  onRail?: () => void;
  acts?: BoxAct[];
  /** Open, the place's verbs on the doors' sideways row («Registra», «Cambia i cibi»). */
  verbs?: ReactNode;
};

export function ThingBox({
  entry,
  doors,
  children,
  startOpen = false,
  density,
  rail = false,
  mode,
  onRail,
  acts,
  verbs,
}: ThingBoxPlace & {
  entry: BoxEntry;
  /** Its level-1 doors, in its plan's order; «Voto» comes first from `entry.score`. */
  doors: BoxDoor[];
  /** Open, before the doors (a meal's four thin bars, a place's own actions). */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);
  // One door open at a time; a second tap on it shuts it («Oggi a livelli»).
  const [door, setDoor] = useState<string | null>(null);
  return (
    <Box
      entry={entry}
      rail={rail}
      {...(density ? { density } : {})}
      {...(mode ? { mode } : {})}
      {...(onRail ? { onRail } : {})}
      {...(acts ? { acts } : {})}
      expanded={open}
      onToggle={() => setOpen((o) => !o)}
      doors={doors}
      {...(verbs ? { verbs } : {})}
      door={door}
      onDoor={(k: string) => setDoor((d) => (d === k ? null : k))}
    >
      {children}
    </Box>
  );
}
