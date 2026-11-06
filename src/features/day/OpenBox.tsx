"use client";
/**
 * A kit Box outside the timeline that opens on tap (the boards' head
 * button): its score's parts when it has one. What the box holds below
 * (Oggi's day: its Nutrients) comes from the server as children.
 *
 * With `compact` and `levelKey` it has two levels (UI-80, the developer's
 * «più gradi di espandibilità… ricordata nelle aperture delle pagine»):
 * 0 the compact form (the four thin bars), 1 everything; the level is kept.
 */
import { useState, type ReactNode } from "react";
import { Box, useLevel, type BoxEntry } from "@lifeos/kit";

const WORDS = ["le quattro barre", "tutti i nutrienti"];

export function OpenBox({
  entry,
  children,
  compact,
  levelKey,
}: {
  entry: BoxEntry;
  children?: ReactNode;
  compact?: ReactNode;
  levelKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const [level, next] = useLevel(levelKey ?? "", 1, 1);
  const leveled = compact !== undefined && levelKey !== undefined;
  const canOpen = !!entry.score;
  return (
    <Box
      entry={entry}
      rail={false}
      {...(canOpen ? { expanded: open, onToggle: () => setOpen(!open) } : {})}
    >
      {leveled && level === 0 ? compact : children}
      {leveled && (
        <button
          type="button"
          className="k-btn link k-lvbtn"
          onClick={next}
          aria-label={"Mostra " + WORDS[level] + ": tocca per " + WORDS[(level + 1) % 2]}
        >
          {level === 0 ? "Tutti i nutrienti" : "Meno"}
          <span className="k-lv" aria-hidden="true">
            {[0, 1].map((i) => (
              <i key={i} className={i <= level ? "on" : ""} />
            ))}
          </span>
        </button>
      )}
    </Box>
  );
}
