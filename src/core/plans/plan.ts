/**
 * core/plans/plan.ts — each day's ciclo steps (PL-31…33): from today on, each live ciclo's step
 * due (E3 `cyclePlan`), with the step after it («poi Riposo»). Past days are what happened: no
 * step is shown for them. Pure; `read.ts` gathers its input. The blocchi of a day are
 * `day-blocks.ts`; day models are gone (MOD-32, PL-61; change 2026-11-07-piano).
 */
import { cyclePlan, isRest, type Cycle, type Occurrence } from "../engines/planning";
import { addDays, daysBetween, type IsoDate } from "../engines/time";

export type CycleStepDue = {
  cycleId: string;
  cycle: string;
  /** The step's label, «Riposo» for a rest without one. */
  label: string;
  rest: boolean;
  /** Its first object (the step's scheda), for the Piano of the day (PL-30, PL-40). */
  itemId: string | null;
  late: boolean;
  skipped: boolean;
  /** The step due the day after, when planned. */
  next: string | null;
};

export type DayPlan = { cycles: CycleStepDue[] };

export type PlanCycle = Cycle & { id: string; name: string };

export type PlanInput = {
  today: IsoDate;
  from: IsoDate;
  to: IsoDate;
  cycles: readonly PlanCycle[];
  done: readonly Occurrence[];
  overrides: ReadonlyMap<string, readonly { day: IsoDate; position: number | null }[]>;
  skips: ReadonlyMap<string, readonly IsoDate[]>;
};

const REST_WORD = "Riposo";

export function dayPlans(input: PlanInput): Map<IsoDate, DayPlan> {
  const out = new Map<IsoDate, DayPlan>();
  for (let d = input.from; d <= input.to; d = addDays(d, 1)) out.set(d, { cycles: [] });

  if (input.to < input.today) return out;
  // One more day than shown: the last day's «poi».
  const days = daysBetween(input.today, input.to) + 2;
  for (const c of input.cycles) {
    const { plan } = cyclePlan({
      cycle: c,
      today: input.today,
      done: input.done.filter((o) => o.day >= c.start),
      days,
      overrides: input.overrides.get(c.id) ?? [],
      skips: input.skips.get(c.id) ?? [],
    });
    const label = (s: (typeof plan)[number]["step"]) =>
      s.label || (isRest(s) ? REST_WORD : "Passo " + (s.position + 1));
    plan.forEach((p, i) => {
      const day = out.get(p.day);
      if (!day) return;
      const after = plan[i + 1];
      day.cycles.push({
        cycleId: c.id,
        cycle: c.name,
        label: label(p.step),
        rest: isRest(p.step),
        itemId: p.step.keys[0] ?? null,
        late: p.late,
        skipped: p.skipped,
        next: after && after.day === addDays(p.day, 1) ? label(after.step) : null,
      });
    });
  }
  return out;
}

/** «PLPRR: oggi Push, poi Riposo» — the words of a day's plan. */
export function planWords(plan: DayPlan | undefined, isToday: boolean): string {
  if (!plan) return "";
  const parts: string[] = [];
  for (const c of plan.cycles)
    parts.push(
      c.cycle +
        ": " +
        (isToday ? "oggi " : "") +
        c.label +
        (c.skipped ? " (saltato)" : c.late ? " (in ritardo)" : "") +
        (c.next ? ", poi " + c.next : ""),
    );
  const s = parts.join(" · ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The day's cycles only, as Oggi's header context: «ciclo PLPRR: oggi Push, poi Riposo». */
export function cycleWords(plan: DayPlan | undefined, isToday: boolean): string {
  if (!plan || plan.cycles.length === 0) return "";
  return plan.cycles
    .map(
      (c) =>
        "ciclo " +
        c.cycle +
        ": " +
        (isToday ? "oggi " : "") +
        c.label +
        (c.skipped ? " (saltato)" : c.late ? " (in ritardo)" : "") +
        (c.next ? ", poi " + c.next : ""),
    )
    .join(" · ");
}

/** A day's name in the week strip: its first ciclo's step. */
export function planTag(plan: DayPlan | undefined): string {
  return plan?.cycles[0]?.label ?? "";
}
