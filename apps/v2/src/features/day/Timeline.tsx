"use client";
/**
 * The day's timeline (V-01): the timed rows in order, the "now" line when
 * the day is today, and the rail's two modes (compact · times) switched by
 * the chip or by tapping any rail. Rows arrive as plain data; how each is
 * drawn (its actions) is the day's, through `row`. This component only
 * holds the mode.
 *
 * With `parts` (ledger UI-77, decided 30 Oct): the parts of the day as bands
 * of their sky that cut the rail, drawn when begun or holding something;
 * two hours or more with nothing as a dashed bar that fills it (`gap`); the
 * day's end closes a day already gone.
 */
import { useState, type ReactNode } from "react";
import {
  DayPart,
  EmptyTime,
  F,
  Glyph,
  type BoxEntry,
  type DayPartName,
} from "@lifeos/kit";

export type Part = { name: DayPartName; from: number; to: number };
export const GAP_MIN = 120;

export function Timeline<R extends BoxEntry & { minute: number }>({
  rows,
  now,
  row,
  parts,
  gone = false,
  end,
  gap,
}: {
  rows: R[];
  /** The current minute of the logical day, when the day is today. */
  now: { minute: number; label: string } | null;
  row: (r: R, mode: "compact" | "times", onRail: () => void) => ReactNode;
  parts?: Part[];
  /** The day is over: every part is drawn, the end band closes it. */
  gone?: boolean;
  /** The day's last minute (the boundary of the next one), for the end band. */
  end?: number;
  /** Where a stretch with nothing leads: the meal missing at that hour, else ⊕. */
  gap?: (from: number, to: number) => { href: string; what: string };
}) {
  const [times, setTimes] = useState(false);
  const toggle = () => setTimes(!times);
  const mode = times ? "times" : "compact";
  const line = now && (
    <div key="now" className="k-now" aria-label={"Adesso, " + now.label}>
      <span className="t">{now.label}</span>
      <span className="line" />
    </div>
  );
  const chip = (
    <div className="k-line end">
      <button type="button" className="k-chip" onClick={toggle} aria-pressed={times}>
        <Glyph of={{ ui: "time" }} size="s" />
        {times ? "Compatta" : "Orari"}
      </button>
    </div>
  );
  if (!parts) {
    const nowAt = now ? rows.findIndex((r) => r.minute > now.minute) : -1;
    return (
      <>
        {chip}
        {rows.map((r, i) => (
          <div key={i} className="k-stack k-tlrow">
            {i === nowAt && line}
            {row(r, mode, toggle)}
          </div>
        ))}
        {now && nowAt === -1 && line}
      </>
    );
  }
  const out: ReactNode[] = [];
  let last: number | null = null;
  let nowDrawn = false;
  const empty = (from: number, to: number, key: string) => {
    if (!gap || to - from < GAP_MIN) return;
    const g = gap(from, to);
    out.push(
      <EmptyTime
        key={key}
        minutes={to - from}
        label={F.hm(to - from) + " senza niente"}
        href={g.href}
        what={g.what}
      />,
    );
  };
  // Parts already passed with nothing in them, one after the other, make one band.
  let blank: Part[] = [];
  const flush = () => {
    if (blank.length === 0) return;
    const first = blank[0]!;
    const lastPart = blank[blank.length - 1]!;
    out.push(
      <DayPart
        key={"p" + first.name}
        name={first.name}
        {...(blank.length > 1 ? { label: first.name + " – " + lastPart.name } : {})}
        when={blank.length > 1 ? "" : "dalle " + F.time(first.from)}
        empty
      />,
    );
    blank = [];
  };
  for (const p of parts) {
    const mine = rows.filter((r) => r.minute >= p.from && r.minute < p.to);
    const begun = gone || (now !== null && now.minute >= p.from);
    if (!begun && mine.length === 0) continue;
    const passed = gone || (now !== null && now.minute >= p.to);
    if (mine.length === 0 && passed) {
      blank.push(p);
      continue;
    }
    flush();
    out.push(
      <DayPart key={"p" + p.name} name={p.name} when={"dalle " + F.time(p.from)} />,
    );
    mine.forEach((r, i) => {
      if (last !== null && (now === null || r.minute <= now.minute))
        empty(last, r.minute, "g" + p.name + i);
      if (!nowDrawn && now && r.minute > now.minute) {
        out.push(line);
        nowDrawn = true;
      }
      out.push(
        <div key={"r" + p.name + i} className="k-stack k-tlrow">
          {row(r, mode, toggle)}
        </div>,
      );
      last = r.minute;
    });
    // Up to now, inside the part where now is: the time passed since the last thing.
    if (now && !nowDrawn && now.minute >= p.from && now.minute < p.to) {
      if (last !== null) empty(last, now.minute, "gn" + p.name);
      out.push(line);
      nowDrawn = true;
    }
  }
  flush();
  if (now && !nowDrawn) out.push(line);
  if (gone && end !== undefined)
    out.push(<DayPart key="end" name="Fine giornata" when={"alle " + F.time(end)} />);
  return (
    <>
      {chip}
      {out}
    </>
  );
}
