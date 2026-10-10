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
