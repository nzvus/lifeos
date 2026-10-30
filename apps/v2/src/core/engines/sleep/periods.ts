/**
 * Sleep periods (dossiers/sleep.md §5): a night logged in pieces is one
 * period, rebuilt on read from the pieces' instants, never from the day they
 * were logged on.
 *   union     overlapping pieces merge (a double entry is counted once)
 *   period    pieces join while the gap between them is ≤ 2 h; asleep = Σ
 *             pieces, awake = the gaps (WASO), awakenings = their count
 *   the day   periods whose wake falls on the local date; the longest asleep
 *             is the night, the others are naps; the day's sleep is all of it
 *             (Jackson 2014: performance tracks the sleep of 24 h)
 * A piece over 14 h or not after its start is left out (migration.md, data
 * review). The 2-hour gap is the agent's choice (decided 30 Oct).
 */
import { localParts, type IsoDate } from "../time";

export type Piece = { start: Date; end: Date };
export type SleepPeriod = {
  bed: Date;
  wake: Date;
  /** Minutes asleep: the pieces' union. */
  asleepMin: number;
  /** Minutes awake between the pieces (WASO). */
  awakeMin: number;
  awakenings: number;
  pieces: number;
};

export const JOIN_GAP_MIN = 120;
const MAX_PIECE_MIN = 14 * 60;
const minutes = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 60_000;

export function sleepPeriods(pieces: readonly Piece[]): SleepPeriod[] {
  const valid = pieces
    .filter(
      (p) => minutes(p.start, p.end) > 0 && minutes(p.start, p.end) <= MAX_PIECE_MIN,
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Piece[] = [];
  for (const p of valid) {
    const last = merged.at(-1);
    if (last && p.start <= last.end) {
      if (p.end > last.end) merged[merged.length - 1] = { start: last.start, end: p.end };
    } else merged.push(p);
  }
  const out: SleepPeriod[] = [];
  for (const p of merged) {
    const cur = out.at(-1);
    const gap = cur ? minutes(cur.wake, p.start) : Infinity;
    if (cur && gap <= JOIN_GAP_MIN) {
      cur.awakeMin += gap;
      cur.awakenings += 1;
      cur.asleepMin += minutes(p.start, p.end);
      cur.wake = p.end;
      cur.pieces += 1;
    } else
      out.push({
        bed: p.start,
        wake: p.end,
        asleepMin: minutes(p.start, p.end),
        awakeMin: 0,
        awakenings: 0,
        pieces: 1,
      });
  }
  return out;
}

export type SleepDay = {
  /** The longest period ending on the day; null when none. */
  night: SleepPeriod | null;
  naps: SleepPeriod[];
  /** All the sleep ending on the day, minutes. */
  totalMin: number;
};

/** The sleep of a local date: the periods whose wake falls on it. */
export function sleepOn(
  pieces: readonly Piece[],
  day: IsoDate,
  timeZone: string,
): SleepDay {
  const mine = sleepPeriods(pieces).filter(
    (p) => localParts(p.wake, timeZone).date === day,
  );
  const night = mine.reduce<SleepPeriod | null>(
    (a, p) => (!a || p.asleepMin > a.asleepMin ? p : a),
    null,
  );
  return {
    night,
    naps: mine.filter((p) => p !== night),
    totalMin: mine.reduce((a, p) => a + p.asleepMin, 0),
  };
}
