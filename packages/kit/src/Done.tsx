/**
 * Done (MOD-56, VIS-22; bars-study §19.1, his 20 Nov «alcuni tracker potrebbero essere dei
 * binari, come semplici sì o no»): a yes / no measure, for any class. A day is one cell in the
 * voce's own shape — fatto solid, previsto outlined and hatched, saltato struck, nothing a faint
 * outline; a week is a row of seven, a month a calendar, a goal «n volte» its n cells with the
 * done ones filled. No bar, no dot, no count written that the cells already show: only a streak
 * of three or more is said, since a calendar does not show it at a glance.
 */
import type { CSSProperties } from "react";
import { WORDS } from "./words";

export type DoneState = "done" | "planned" | "skipped" | "missed";

const word = (s: DoneState) => (s === "missed" ? WORDS.missed : WORDS.status[s]);

/** One day's state, beside its name. */
export function DoneDay({
  name,
  state,
  color,
}: {
  name: string;
  state: DoneState;
  color: string;
}) {
  return (
    <div className="k-done day" style={{ "--c": color } as CSSProperties}>
      <span className="nm">{name}</span>
      <span className={"cell " + state} role="img" aria-label={word(state)} />
    </div>
  );
}

/** A period's days (a week, a month from its weekday `lead`), or a goal's n cells. */
export function DoneCells({
  name,
  grid,
  cells,
  streak,
  color,
  lead = 0,
}: {
  name: string;
  grid: "week" | "month" | "goal";
  cells: { d: string; s: DoneState }[];
  streak: number;
  color: string;
  lead?: number;
}) {
  const done = cells.filter((c) => c.s === "done").length;
  return (
    <div
      className={"k-done " + grid}
      style={{ "--c": color } as CSSProperties}
      role="img"
      aria-label={name + ": " + WORDS.doneOf(done, cells.length)}
    >
      <span className="k-thead">
        <span className="nm">{name}</span>
        {streak >= 3 && <b className="n">{WORDS.streak(streak)}</b>}
      </span>
      <span className="cells">
        {grid === "month" &&
          Array.from({ length: lead }, (_, i) => (
            <span key={"l" + i} className="blank" />
          ))}
        {cells.map((c, i) => (
          <span key={i} className="day">
            <span className={"cell " + c.s} />
            {grid === "week" && <span className="lb">{c.d}</span>}
          </span>
        ))}
      </span>
    </div>
  );
}
