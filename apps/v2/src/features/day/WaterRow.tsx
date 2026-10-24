"use client";
/**
 * The day's water inside the timeline (the Main board): one box for every
 * drink, at the last one's time (or now), with +250 and +500 ml as its row
 * actions. It opens on its score's parts and the drinks with their times,
 * each a link to its page (to change or remove it).
 */
import { useState, useTransition } from "react";
import { Box, type BoxEntry } from "@lifeos/kit";

export type Water = {
  entry: BoxEntry;
  minute: number;
  drinks: { id: string; label: string }[];
  /** The server action, bound to the day. */
  add: (ml: 250 | 500) => Promise<void>;
};

export function WaterRow({
  water,
  mode,
  onRail,
}: {
  water: Water;
  mode: "compact" | "times";
  onRail: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const add = (ml: 250 | 500) => () => start(() => water.add(ml));
  return (
    <Box
      entry={water.entry}
      mode={mode}
      onRail={onRail}
      acts={
        busy
          ? []
          : [
              { label: "+250", aria: "Aggiungi 250 ml", onClick: add(250) },
              { label: "+500", aria: "Aggiungi 500 ml", onClick: add(500) },
            ]
      }
      expanded={open}
      onToggle={() => setOpen(!open)}
    >
      {open && water.drinks.length > 0 && (
        <ul
          className="k-stack g1"
          aria-label="Bevute"
          style={{ listStyle: "none", padding: 0 }}
        >
          {water.drinks.map((d) => (
            <li key={d.id}>
              <a className="k-link k-body" href={"/voce/" + d.id}>
                {d.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}
