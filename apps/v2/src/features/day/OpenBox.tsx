"use client";
/**
 * A kit Box outside the timeline that opens on tap (the boards' head
 * button): its score's parts when it has one. What the box holds below
 * (Oggi's day: its Nutrients) comes from the server as children.
 */
import { useState, type ReactNode } from "react";
import { Box, type BoxEntry } from "@lifeos/kit";

export function OpenBox({ entry, children }: { entry: BoxEntry; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const canOpen = !!entry.score;
  return (
    <Box
      entry={entry}
      rail={false}
      {...(canOpen ? { expanded: open, onToggle: () => setOpen(!open) } : {})}
    >
      {children}
    </Box>
  );
}
