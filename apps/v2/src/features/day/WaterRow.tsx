"use client";
/**
 * The day's water inside the timeline (the Main board): one box for every
 * drink, at the last one's time (or now), with +250 and +500 ml as its row
 * actions. It opens on its score's parts and the drinks with their times,
 * each a link to its page (to change or remove it). The same amount tapped
 * again within 10 s asks first («Ancora +500?»): the export of 29 Oct had
 * two 500 ml drinks one second apart (capture.md §8.1).
 */
import { useEffect, useState, useTransition } from "react";
import { Box, type BoxEntry } from "@lifeos/kit";

export type Water = {
  entry: BoxEntry;
  minute: number;
  drinks: { id: string; label: string }[];
  /** The server action, bound to the day. */
  add: (ml: 250 | 500) => Promise<void>;
};

const AGAIN_MS = 10_000;

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
  // The last drink added here, for 10 s: the same amount again is asked, not added.
  const [last, setLast] = useState<250 | 500 | null>(null);
  useEffect(() => {
    if (last === null) return;
    const t = setTimeout(() => setLast(null), AGAIN_MS);
    return () => clearTimeout(t);
  }, [last]);
  const add = (ml: 250 | 500) => () =>
    start(async () => {
      await water.add(ml);
      setLast(ml);
    });
  const act = (ml: 250 | 500) =>
    last === ml
      ? {
          label: "Ancora +" + ml + "?",
          aria: "Aggiungi di nuovo " + ml + " ml",
          onClick: () => {
            setLast(null);
            add(ml)();
          },
        }
      : { label: "+" + ml, aria: "Aggiungi " + ml + " ml", onClick: add(ml) };
  return (
    <Box
      entry={water.entry}
      mode={mode}
      onRail={onRail}
      acts={busy ? [] : [act(250), act(500)]}
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
