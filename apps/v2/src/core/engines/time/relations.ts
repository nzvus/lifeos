/**
 * E1 Time — relations between entries (engines.md E1, concepts §8). Kinds
 * declare which relations matter; the engine computes them, the person
 * never sets them. A tag holds while the related entry exists: skip the
 * session and "post-workout" goes by itself.
 */

export type TimedEntry = {
  id: string;
  kind: string;
  at: Date;
  /** End of a span (a session, sleep); absent for an instant. */
  end?: Date;
  status: "planned" | "done" | "skipped";
};

/** Before/after with a gap: gap = this entry's start − the other's start, in minutes. */
export type GapRule = {
  from: string;
  to: string;
  /** Each band tags the entry when some `to` entry sits at a gap in [min, max]. */
  bands: { tag: string; min: number; max: number }[];
};

/** During: an instant of `from` inside a span of `to`. */
export type DuringRule = { from: string; to: string; tag: string };

export type Relations = {
  tags: string[];
  /** The nearest entry of each related kind, with its signed gap in minutes. */
  nearest: { kind: string; id: string; gapMin: number }[];
};

const minutes = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 60_000;
const counts = (e: TimedEntry) => e.status !== "skipped";

/**
 * Meal → session, from ISSN 2017 nutrient timing and Kerksick 2017 (engines.md E1):
 * up to 3 h before is pre-workout, up to 2 h after is post-workout.
 * A meal at the session's very start is pre-workout (the first band wins).
 */
export const MEAL_SESSION: GapRule = {
  from: "meal",
  to: "session",
  bands: [
    { tag: "pre-workout", min: -180, max: 0 },
    { tag: "post-workout", min: 0, max: 120 },
  ],
};

export function relate(
  entries: readonly TimedEntry[],
  gaps: readonly GapRule[],
  during: readonly DuringRule[] = [],
): Map<string, Relations> {
  const live = entries.filter(counts);
  const out = new Map<string, Relations>();
  for (const e of live) {
    const tags: string[] = [];
    const nearest: Relations["nearest"] = [];
    for (const rule of gaps.filter((r) => r.from === e.kind)) {
      const others = live.filter((o) => o.kind === rule.to && o.id !== e.id);
      if (others.length === 0) continue;
      const gapsMin = others.map((o) => ({ o, gap: minutes(e.at, o.at) }));
      const near = gapsMin.reduce((a, b) => (Math.abs(b.gap) < Math.abs(a.gap) ? b : a));
      nearest.push({ kind: rule.to, id: near.o.id, gapMin: Math.round(near.gap) });
      for (const { gap } of gapsMin) {
        const band = rule.bands.find((b) => gap >= b.min && gap <= b.max);
        if (band && !tags.includes(band.tag)) tags.push(band.tag);
      }
    }
    for (const rule of during.filter((r) => r.from === e.kind)) {
      const inside = live.some(
        (o) => o.kind === rule.to && o.end !== undefined && e.at >= o.at && e.at <= o.end,
      );
      if (inside && !tags.includes(rule.tag)) tags.push(rule.tag);
    }
    out.set(e.id, { tags, nearest });
  }
  return out;
}

/** Minutes since the last entry of a kind that started before `at` (done only), or null if none. */
export function sinceLast(
  entries: readonly TimedEntry[],
  kind: string,
  at: Date,
): number | null {
  const before = entries.filter(
    (e) => e.kind === kind && e.status === "done" && e.at <= at,
  );
  if (before.length === 0) return null;
  const last = before.reduce((a, b) => (b.at > a.at ? b : a));
  return Math.round(minutes(at, last.at));
}
