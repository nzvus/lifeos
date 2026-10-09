/**
 * core/energy/repositories/outlook.ts — the coming days at a glance: each
 * day's type, the training on it (planned sessions, or what the active
 * program puts there, ADR-0024), the energy it should cost and the targets
 * that follow (dynamic days, ADR-0014/0023). So the week can be planned,
 * not only looked back on. Estimates, as everywhere: ranges and midpoints.
 */
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { readDays } from "../../day/repositories/days";
import { resolveDay } from "../../day/resolve";
import type { DayProfile } from "../../nutrition/repositories/profiles";
import { addDays } from "../../shared/dates";
import { getActivePlan, programOverrideDays } from "../../training/repositories/programs";
import { listSessions } from "../../training/repositories/sessions";
import type { Goal, Range } from "../energy";

export type OutlookDay = {
  day: string;
  dayType: string | null;
  goal: Goal | "custom" | null;
  /** Planned / done sessions, then the program's routine if not among them. */
  training: { label: string; fromProgram: boolean; late: boolean }[];
  rest: boolean;
  /** ADR-0029: the program's slot for this day was changed by hand. */
  changed: boolean;
  energy: Range | null;
  targets: { kcal: number; protein: number; carbs: number; fat: number } | null;
};

export async function weekOutlook(
  db: Db,
  owner: Owner,
  today: string,
  days = 7,
): Promise<OutlookDay[]> {
  const last = addDays(today, days - 1);
  const [sessions, active, resolved] = await Promise.all([
    listSessions(db, owner, today, last),
    getActivePlan(db, owner, today, days),
    // ADR-0040: the same engine as the day page (targets only: no maxima).
    readDays(db, owner, today, last, { today, autoTargets: false }),
  ]);
  const changed = active
    ? await programOverrideDays(db, owner, active.program.id, today)
    : new Set<string>();
  const out: OutlookDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    const slot = active?.plan.find((p) => p.day === day) ?? null;
    const own = sessions.filter((s) => s.day === day);
    // The program's slot, unless a session of the day already covers it.
    const covered =
      slot &&
      own.some((s) =>
        slot.slot.items.some((it) =>
          it.routineId
            ? s.routineId === it.routineId
            : s.exercises.some((e) => e.exerciseId === it.exerciseId),
        ),
      );
    // ADR-0035: a skipped day has nothing from the program.
    const fromProgram = slot && !covered && !slot.skipped && slot.slot.items.length > 0;
    const r = resolved.get(day)!;
    const training = [
      ...own.map((s) => ({ label: s.label, fromProgram: false, late: false })),
      ...(fromProgram
        ? [
            {
              label:
                active!.program.slots.find((x) => x.position === slot.slot.position)
                  ?.name ?? "",
              fromProgram: true,
              late: slot.late,
            },
          ]
        : []),
    ];
    out.push({
      day,
      dayType: r.plan.source === "none" ? null : r.plan.name,
      goal: r.goal,
      training,
      rest: training.length === 0,
      changed: changed.has(day),
      energy: r.energy.energy?.total.withPlan ?? null,
      targets: mainTargets(r.own),
    });
  }
  return out;
}

/** The four main targets, rounded; null without an energy target. */
function mainTargets(own: Record<"kcal" | "protein" | "carbs" | "fat", string | null>) {
  if (own.kcal === null) return null;
  const n = (v: string | null) => (v === null ? 0 : Math.round(Number(v)));
  return {
    kcal: n(own.kcal),
    protein: n(own.protein),
    carbs: n(own.carbs),
    fat: n(own.fat),
  };
}

export type TodayTargets = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

/**
 * What each DYNAMIC day type would ask today (the day-type list): its
 * parameters on today's energy, through the same engine as the day page
 * (ADR-0040). Fixed types show their own numbers.
 */
export async function dynamicTargetsToday(
  db: Db,
  owner: Owner,
  today: string,
  profiles: readonly DayProfile[],
): Promise<Map<string, TodayTargets>> {
  const out = new Map<string, TodayTargets>();
  const dynamic = profiles.filter((p) => p.mode === "dynamic");
  if (!dynamic.length) return out;
  const day = (
    await readDays(db, owner, today, today, { today, autoTargets: false })
  ).get(today)!;
  for (const p of dynamic) {
    const r = resolveDay(
      today,
      {
        source: "default",
        profileId: p.id,
        name: p.name,
        targets: day.own,
        dynamic: {
          deficitKcal: p.deficitKcal,
          proteinGPerKg: p.proteinGPerKg,
          fatGPerKg: p.fatGPerKg,
        },
      },
      day.energy,
      { autoTargets: false },
    );
    if (r.computed) out.set(p.id, r.computed);
  }
  return out;
}
