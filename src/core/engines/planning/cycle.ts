/**
 * E3 Planning — cycles (concepts §5): ordered steps of anything (routines,
 * exercises, recipes, day types). What each coming day holds is DERIVED from
 * the steps and the occurrences done, never stored (v1 ADR-0024).
 *
 * A step lists keys; an occurrence done counts for a step when it carries any
 * of them (v1 ADR-0035). A step with no keys is a rest: nothing to do.
 *
 * `advance: "occurrence"` (a training program), walking from the start:
 *   - a day with nothing that counts: a rest due is taken; a step due stays
 *     due — the cycle slips, and the step shows late;
 *   - an occurrence of the step due: done, the cycle moves on;
 *   - an occurrence of another step of this round: done ahead, passed when
 *     reached; a rest due that day is taken first;
 *   - an occurrence that fits no step: extra, ignored.
 * `advance: "date"` (dinner rotates four recipes): day k from the start holds
 * step k mod n, whatever was done.
 *
 * Decisions (schema `decisions`): a skipped day either loses the step due (the
 * cycle moves on, nothing late; v1 ADR-0035) or shifts it to the next day
 * (`onSkip`). Overrides change single coming days, to a step or to rest (v1
 * ADR-0029): they take their days first; by occurrence, the cycle fills the
 * other days skipping a step an override places later in the same round, and
 * a rest override pauses it (a rest due is taken).
 */
import type { IsoDate } from "../time/date";
import { addDays, daysBetween } from "../time/date";

export type Step = { position: number; keys: readonly string[]; label?: string };
export type Occurrence = { day: IsoDate; keys: readonly string[] };

export type Cycle = {
  steps: readonly Step[];
  start: IsoDate;
  advance: "occurrence" | "date";
  onSkip: "lose" | "shift";
};

export type CycleDay = {
  day: IsoDate;
  /** The step due; a rest when it has no keys. */
  step: Step;
  /** The cycle slipped: this step was due earlier and was not done. */
  late: boolean;
  /** Skipped on purpose: shown, not to do. */
  skipped: boolean;
};

export type CycleInput = {
  cycle: Cycle;
  today: IsoDate;
  /** Occurrences done from the start on, any order. */
  done: readonly Occurrence[];
  /** How many days to plan from today. */
  days: number;
  /** Coming days changed by hand: a step's position, or null for rest. */
  overrides?: readonly { day: IsoDate; position: number | null }[];
  /** Days skipped on purpose. */
  skips?: readonly IsoDate[];
};

export const isRest = (s: Step) => s.keys.length === 0;
const counts = (s: Step, o: Occurrence) => s.keys.some((k) => o.keys.includes(k));
const REST: Step = { position: -1, keys: [] };

export function cyclePlan(input: CycleInput): { plan: CycleDay[]; doneToday: boolean } {
  const steps = [...input.cycle.steps].sort((a, b) => a.position - b.position);
  if (steps.length === 0) return { plan: [], doneToday: false };
  const doneToday = input.done.some((o) => o.day === input.today);
  return input.cycle.advance === "date"
    ? { plan: byDate(input, steps), doneToday }
    : { plan: byOccurrence(input, steps, doneToday), doneToday };
}

function firstPlanned(input: CycleInput, doneToday: boolean): IsoDate {
  if (input.today < input.cycle.start) return input.cycle.start;
  return doneToday ? addDays(input.today, 1) : input.today;
}

function byDate(input: CycleInput, steps: Step[]): CycleDay[] {
  const n = steps.length;
  const skips = new Set(input.skips ?? []);
  const overrides = new Map((input.overrides ?? []).map((o) => [o.day, o.position]));
  const byPos = new Map(steps.map((s) => [s.position, s]));
  const plan: CycleDay[] = [];
  const from = input.today < input.cycle.start ? input.cycle.start : input.today;
  const last = addDays(input.today, input.days - 1);
  // With "shift", every skipped day before d holds the rotation back by one.
  let shifted = 0;
  if (input.cycle.onSkip === "shift")
    for (const s of skips) if (s >= input.cycle.start && s < from) shifted++;
  for (let d = from; d <= last; d = addDays(d, 1)) {
    const k = daysBetween(input.cycle.start, d) - shifted;
    const step = steps[((k % n) + n) % n]!;
    const o = overrides.get(d);
    if (skips.has(d)) {
      plan.push({ day: d, step, late: false, skipped: true });
      if (input.cycle.onSkip === "shift") shifted++;
      continue;
    }
    if (o !== undefined && (o === null || byPos.has(o))) {
      plan.push({
        day: d,
        step: o === null ? REST : byPos.get(o)!,
        late: false,
        skipped: false,
      });
      continue;
    }
    plan.push({ day: d, step, late: false, skipped: false });
  }
  return plan;
}

function byOccurrence(input: CycleInput, steps: Step[], doneToday: boolean): CycleDay[] {
  const { cycle, today } = input;
  const n = steps.length;
  const skips = new Set(input.skips ?? []);
  const lose = cycle.onSkip === "lose";
  let p = 0; // the step due, as a count from the start (p % n)
  let since = cycle.start; // the day the due step became due
  const ahead = new Set<number>(); // counts done ahead of p in this round
  const due = () => steps[p % n]!;
  const byDay = new Map<IsoDate, Occurrence[]>();
  for (const o of input.done)
    if (o.day >= cycle.start) byDay.set(o.day, [...(byDay.get(o.day) ?? []), o]);

  const next = () => {
    p++;
    while (ahead.has(p)) ahead.delete(p++);
  };
  const advance = (d: IsoDate) => {
    next();
    since = d;
  };
  const markAhead = (match: (s: Step) => boolean) => {
    for (let q = p + 1; q < p + n; q++)
      if (match(steps[q % n]!) && !ahead.has(q)) {
        ahead.add(q);
        return;
      }
  };
  const take = (d: IsoDate, occurrences: readonly Occurrence[]) => {
    const counted = occurrences.filter((o) => steps.some((s) => counts(s, o)));
    if (counted.length === 0) {
      if (isRest(due())) advance(addDays(d, 1));
      return;
    }
    if (isRest(due())) advance(d); // done on a rest day: the rest is taken as done
    for (const o of counted) {
      if (counts(due(), o)) advance(addDays(d, 1));
      else markAhead((s) => counts(s, o));
    }
  };

  for (let d = cycle.start; d < today; d = addDays(d, 1)) {
    const occurrences = byDay.get(d) ?? [];
    // A skipped day passes (lose) or holds (shift) the step due; it does not also take a rest.
    if (skips.has(d) && !isRest(due())) {
      if (lose) advance(addDays(d, 1));
      else since = addDays(d, 1);
      if (occurrences.length) take(d, occurrences);
      continue;
    }
    take(d, occurrences);
  }
  if (doneToday) take(today, byDay.get(today) ?? []);

  const plan: CycleDay[] = [];
  let d = firstPlanned(input, doneToday);
  const last = addDays(today, input.days - 1);
  const byPos = new Map(steps.map((s) => [s.position, s]));
  // Coming overrides of an existing step, in day order; `taken` once the cycle
  // has passed over their step (so the override day doesn't take it again).
  const placed = (input.overrides ?? [])
    .filter((o) => o.day >= d && o.day <= last)
    .filter((o) => o.position === null || byPos.has(o.position))
    .sort((a, b) => (a.day < b.day ? -1 : 1))
    .map((o) => ({ ...o, taken: false }));
  const overrideOn = new Map(placed.map((o) => [o.day, o]));

  for (; d <= last; d = addDays(d, 1)) {
    if (skips.has(d) && !isRest(due())) {
      plan.push({ day: d, step: due(), late: false, skipped: true });
      if (lose) next();
      continue;
    }
    const o = overrideOn.get(d);
    if (o) {
      if (o.position === null) {
        if (isRest(due())) next(); // a rest due is taken; else the cycle waits
        plan.push({ day: d, step: REST, late: false, skipped: false });
        continue;
      }
      if (!o.taken) {
        // Consume its step from the cycle: the one due, or the next of the round.
        if (due().position === o.position) next();
        else markAhead((s) => s.position === o.position);
      }
      plan.push({ day: d, step: byPos.get(o.position)!, late: false, skipped: false });
      continue;
    }
    // Pass steps an override places on a later day (at most one round).
    for (let guard = 0; guard < n; guard++) {
      const later = placed.find(
        (x) => !x.taken && x.day > d && x.position === due().position,
      );
      if (!later || isRest(due())) break;
      later.taken = true;
      next();
    }
    const step = due();
    const late = plan.length === 0 && !isRest(step) && since < d;
    plan.push({ day: d, step, late, skipped: false });
    next();
  }
  return plan;
}
