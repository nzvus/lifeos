"use client";
/**
 * The day's timeline (V-01): the timed Boxes in order, the "now" line when
 * the day is today, and the rail's two modes (compact · times) switched by
 * the chip or by tapping any rail. Rows arrive as plain data (BoxEntry):
 * the server composes and presents them, this component only holds the mode.
 */
import { useState } from "react";
import { Box, Glyph, type BoxEntry } from "@lifeos/kit";

export function Timeline({
  rows,
  now,
}: {
  rows: (BoxEntry & { minute: number })[];
  /** The current minute of the logical day, when the day is today. */
  now: { minute: number; label: string } | null;
}) {
  const [times, setTimes] = useState(false);
  const toggle = () => setTimes(!times);
  const nowAt = now ? rows.findIndex((r) => r.minute > now.minute) : -1;
  const line = now && (
    <div className="k-now" aria-label={"Adesso, " + now.label}>
      <span className="t">{now.label}</span>
      <span className="line" />
    </div>
  );
  return (
    <>
      <div className="k-line end">
        <button type="button" className="k-chip" onClick={toggle} aria-pressed={times}>
          <Glyph of={{ ui: "time" }} size="s" />
          {times ? "Compatta" : "Orari"}
        </button>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="k-stack">
          {i === nowAt && line}
          <Box entry={r} mode={times ? "times" : "compact"} onRail={toggle} />
        </div>
      ))}
      {now && nowAt === -1 && line}
    </>
  );
}
