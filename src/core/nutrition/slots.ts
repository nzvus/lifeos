/**
 * core/nutrition/slots.ts — a day's food against its program's slots
 * (ADR-0044). Pure.
 *
 * Each slot of the day type's program is matched with the day's group of
 * the same moment (groupByMoment). A snack slot takes the snack group
 * closest in time, within 2 hours. A matched group carries its slot: the
 * time, a target (the slot's share × the day's target) and what was eaten.
 * A slot with no food yet becomes a placeholder at its time. Groups with
 * no slot stay as they are. The result is one list in day order.
 *
 * Hints (soft, from the plan §3) say what a slot is for:
 *   pre_workout   1–3 h before: carbs 0.5–1 g/kg (less the closer to
 *                 training), a little protein, little fat and fibre
 *   post_workout  within ~2 h: protein ~0.4 g/kg, with carbs
 *   pre_sleep     slow protein ~0.4 g/kg (Greek yogurt, skyr, ricotta)
 */
import type { Moment, MomentGroup } from "./moments";
import type { ProgramSlot } from "./programs";

/** A snack slot takes a snack group only this close in time. */
const SNACK_WINDOW_MIN = 120;

export type SlotTarget = { kcal: number | null; protein: number | null };

export type SlotHint =
  | { kind: "pre_workout"; carbsLow: number; carbsHigh: number }
  | { kind: "post_workout" | "pre_sleep"; protein: number }
  | null;

export type SlotInfo = {
  at: number;
  target: SlotTarget;
  hint: SlotHint;
};

export type DayItem<E> =
  | { type: "group"; group: MomentGroup<E>; slot: SlotInfo | null; eatenProtein: number }
  | { type: "empty"; key: string; moment: Moment; slot: SlotInfo };

type Entry = { status: "planned" | "eaten"; totals: { nutrients: { protein: string } } };

function hintFor(kind: Moment, kg: number | null): SlotHint {
  if (kg === null) return null;
  if (kind === "pre_workout")
    return { kind, carbsLow: Math.round(0.5 * kg), carbsHigh: Math.round(kg) };
  if (kind === "post_workout" || kind === "pre_sleep")
    return { kind, protein: Math.round(0.4 * kg) };
  return null;
}

export function withSlots<E extends Entry>(
  groups: readonly MomentGroup<E>[],
  slots: readonly ProgramSlot[],
  day: { kcal: number | null; protein: number | null; kg: number | null },
): DayItem<E>[] {
  const info = (s: ProgramSlot): SlotInfo => ({
    at: s.at,
    target: {
      kcal:
        s.kcalShare !== null && day.kcal !== null
          ? Math.round(s.kcalShare * day.kcal)
          : null,
      protein:
        s.proteinShare !== null && day.protein !== null
          ? Math.round(s.proteinShare * day.protein)
          : null,
    },
    hint: hintFor(s.kind, day.kg),
  });
  const taken = new Map<MomentGroup<E>, ProgramSlot>();
  const empty: ProgramSlot[] = [];
  for (const s of [...slots].sort((a, b) => a.at - b.at)) {
    const free = groups.filter((g) => g.moment === s.kind && !taken.has(g));
    const match =
      s.kind === "snack"
        ? free
            .filter(
              (g) => g.minutes !== null && Math.abs(g.minutes - s.at) <= SNACK_WINDOW_MIN,
            )
            .sort((a, b) => Math.abs(a.minutes! - s.at) - Math.abs(b.minutes! - s.at))[0]
        : free[0];
    if (match) taken.set(match, s);
    else empty.push(s);
  }
  const eatenProtein = (g: MomentGroup<E>) =>
    Math.round(
      g.entries
        .filter((e) => e.status === "eaten")
        .reduce((a, e) => a + Number(e.totals.nutrients.protein), 0),
    );
  const items: DayItem<E>[] = [
    ...groups.map((g) => {
      const s = taken.get(g);
      return {
        type: "group" as const,
        group: g,
        slot: s ? info(s) : null,
        eatenProtein: eatenProtein(g),
      };
    }),
    ...empty.map((s, i) => ({
      type: "empty" as const,
      key: `slot-${s.kind}-${i}`,
      moment: s.kind,
      slot: info(s),
    })),
  ];
  // Day order; "not set" (no time) last, as in groupByMoment.
  const when = (x: DayItem<E>) =>
    x.type === "empty" ? x.slot.at : (x.slot?.at ?? x.group.minutes ?? Infinity);
  return items.sort((a, b) => when(a) - when(b));
}

/**
 * Slots around training follow the session's real start (ADR-0044: "pre/
 * post-workout slots move with the session's time"): when today's session
 * started at another time than the program's, pre- and post-workout slots
 * move by the difference. Other slots stay. Minutes after midnight.
 */
export function moveWithSession(
  slots: readonly ProgramSlot[],
  plannedAt: number | null,
  startedAt: number | null,
): ProgramSlot[] {
  if (plannedAt === null || startedAt === null || plannedAt === startedAt)
    return [...slots];
  const by = startedAt - plannedAt;
  const clamp = (m: number) => Math.min(23 * 60 + 59, Math.max(0, m));
  return slots.map((s) =>
    s.kind === "pre_workout" || s.kind === "post_workout"
      ? { ...s, at: clamp(s.at + by) }
      : s,
  );
}

type Fit = { kcal: string; protein: string; carbs: string; fat: string };

/**
 * The user's own meals that fit a slot around training or sleep (ADR-0050),
 * best first, at most `n`; other slots suggest nothing (the usual search
 * by use is already there). Per serving:
 *   pre_workout   80–600 kcal, most energy from carbs, little fat
 *   post_workout  at least 20 g protein, then protein and carbs share
 *   pre_sleep     at least 15 g protein, at most 450 kcal, protein share
 * Ties go to the meal used more.
 */
export function suggestForSlot<T extends { values: Fit; uses: number }>(
  kind: Moment,
  items: readonly T[],
  n = 3,
): T[] {
  const score = (v: Fit): number | null => {
    const kcal = Number(v.kcal);
    if (!(kcal > 0)) return null;
    const share = (g: string, per: number) => (Number(g) * per) / kcal;
    const protein = Number(v.protein);
    if (kind === "pre_workout")
      return kcal >= 80 && kcal <= 600 ? share(v.carbs, 4) - share(v.fat, 9) : null;
    if (kind === "post_workout")
      return protein >= 20 ? share(v.protein, 4) + 0.3 * share(v.carbs, 4) : null;
    if (kind === "pre_sleep")
      return protein >= 15 && kcal <= 450 ? share(v.protein, 4) : null;
    return null;
  };
  return items
    .map((item) => ({ item, s: score(item.values) }))
    .filter((x): x is { item: T; s: number } => x.s !== null && x.s > 0)
    .sort((a, b) => b.s - a.s || b.item.uses - a.item.uses)
    .slice(0, n)
    .map((x) => x.item);
}
