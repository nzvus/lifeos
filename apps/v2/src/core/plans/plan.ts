/**
 * core/plans/plan.ts — what each day is supposed to be (dossiers/
 * day-templates.md §5, slice a): its day model and, from today on, the
 * cycles' steps due. Pure; `read.ts` gathers its input in a few queries.
 *   model  the day's fixed copy (a `day_targets` decision naming its
 *          model), else the week layout's model for that weekday, else none;
 *   cycle  each active cycle's step due (E3 `cyclePlan`) on today and the
 *          days after, with the step after it («poi Riposo»). Past days are
 *          what happened: no step is shown for them.
 */
import { cyclePlan, isRest, type Cycle, type Occurrence } from "../engines/planning";
import { addDays, daysBetween, isoWeekday, type IsoDate } from "../engines/time";

export type DayModelRef = { id: string; name: string; from: "day" | "week" };

export type CycleStepDue = {
  cycleId: string;
  cycle: string;
  /** The step's label, «Riposo» for a rest without one. */
  label: string;
  rest: boolean;
  late: boolean;
  skipped: boolean;
  /** The step due the day after, when planned. */
  next: string | null;
};

export type DayPlan = { model: DayModelRef | null; cycles: CycleStepDue[] };

export type PlanCycle = Cycle & { id: string; name: string };

export type PlanInput = {
  today: IsoDate;
  from: IsoDate;
  to: IsoDate;
  /** Live day models by id. */
  models: ReadonlyMap<string, string>;
  /** ISO weekday (1 Monday … 7 Sunday) → model id. */
  week: ReadonlyMap<number, string>;
  /** A day's fixed copy → the model it was made from. */
  fixed: ReadonlyMap<IsoDate, string>;
  cycles: readonly PlanCycle[];
  done: readonly Occurrence[];
  overrides: ReadonlyMap<string, readonly { day: IsoDate; position: number | null }[]>;
  skips: ReadonlyMap<string, readonly IsoDate[]>;
};

const REST_WORD = "Riposo";

export function dayPlans(input: PlanInput): Map<IsoDate, DayPlan> {
  const out = new Map<IsoDate, DayPlan>();
  const modelOf = (day: IsoDate): DayModelRef | null => {
    const own = input.fixed.get(day);
    if (own && input.models.has(own))
      return { id: own, name: input.models.get(own)!, from: "day" };
    const w = input.week.get(isoWeekday(day));
    return w && input.models.has(w)
      ? { id: w, name: input.models.get(w)!, from: "week" }
      : null;
  };
  for (let d = input.from; d <= input.to; d = addDays(d, 1))
    out.set(d, { model: modelOf(d), cycles: [] });

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
        late: p.late,
        skipped: p.skipped,
        next: after && after.day === addDays(p.day, 1) ? label(after.step) : null,
      });
    });
  }
  return out;
}

/** «Giornata Rec · PLPRR: oggi Push, poi Riposo» — the words of a day's plan. */
export function planWords(plan: DayPlan | undefined, isToday: boolean): string {
  if (!plan) return "";
  const parts: string[] = [];
  if (plan.model) parts.push("giornata «" + plan.model.name + "»");
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
