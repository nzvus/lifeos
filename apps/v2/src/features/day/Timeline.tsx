"use client";
/**
 * The day's timeline (V-01): the timed rows in order, the "now" line when
 * the day is today, and the rail's two modes (compact · times) switched by
 * the chip or by tapping any rail. Rows arrive as plain data; how each is
 * drawn (its actions) is the day's, through `row`. This component only
 * holds the mode.
 */
import { useState, type ReactNode } from "react";
import { Glyph, type BoxEntry } from "@lifeos/kit";

export function Timeline<R extends BoxEntry & { minute: number }>({
  rows,
  now,
  row,
}: {
  rows: R[];
  /** The current minute of the logical day, when the day is today. */
  now: { minute: number; label: string } | null;
  row: (r: R, mode: "compact" | "times", onRail: () => void) => ReactNode;
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
        <div key={i} className="k-stack k-tlrow">
          {i === nowAt && line}
          {row(r, times ? "times" : "compact", toggle)}
        </div>
      ))}
      {now && nowAt === -1 && line}
    </>
  );
}
