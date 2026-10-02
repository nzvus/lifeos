/**
 * core/energy/repositories/outlook.ts — the coming days at a glance: each
 * day's type, the training on it (planned sessions, or what the active
 * program puts there, ADR-0024), the energy it should cost and the targets
 * that follow (dynamic days, ADR-0014/0023). So the week can be planned,
 * not only looked back on. Estimates, as everywhere: ranges and midpoints.
 */
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { carbsGoodMax, trainingLoad } from "../../nutrition/bands";
import { getDayTargets, type DayProfile } from "../../nutrition/repositories/profiles";
import { addDays } from "../../shared/dates";
import { getActivePlan, programSlotOn } from "../../training/repositories/programs";
import { listSessions } from "../../training/repositories/sessions";
import { dynamicTargets, goalOf, type Goal, type Range } from "../energy";
import { getDayEnergy, type DayEnergyView } from "./energy";

export type OutlookDay = {
  day: string;
  dayType: string | null;
  goal: Goal | "custom" | null;
  /** Planned / done sessions, then the program's routine if not among them. */
  training: { label: string; fromProgram: boolean; late: boolean }[];
  rest: boolean;
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
  const [sessions, active] = await Promise.all([
    listSessions(db, owner, today, last),
    getActivePlan(db, owner, today, days),
  ]);
  const out: OutlookDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    const slot = active?.plan.find((p) => p.day === day) ?? null;
    const own = sessions.filter((s) => s.day === day);
    // The program's slot, unless a session of the day already covers it.
    const covered =
      slot &&
      own.some((s) =>
        slot.slot.routineId
          ? s.routineId === slot.slot.routineId
          : s.exercises.some((e) => e.exerciseId === slot.slot.exerciseId),
      );
    const fromProgram = slot && !covered && (slot.slot.routineId || slot.slot.exerciseId);
    const [t, e] = await Promise.all([
      getDayTargets(db, owner, day),
      getDayEnergy(db, owner, day, fromProgram ? slot.slot : null),
    ]);
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
    const targets = targetsOf(t, e);
    out.push({
      day,
      dayType: t.source === "none" ? null : t.name,
      goal: t.source !== "none" && t.dynamic ? (goalOf(t.dynamic) ?? "custom") : null,
      training,
      rest: training.length === 0,
      energy: e.energy?.total.withPlan ?? null,
      targets,
    });
  }
  return out;
}

type DayTargetsView = Awaited<ReturnType<typeof getDayTargets>>;

/** The day's main targets: its type's own, or computed from its energy (dynamic). */
function targetsOf(t: DayTargetsView, e: DayEnergyView): OutlookDay["targets"] {
  if (t.source === "none") return null;
  if (t.dynamic && e.energy && e.body.weightKg) {
    const inputs = e.energy.inputs.sessions;
    const load = trainingLoad(
      inputs.reduce((a, x) => a + x.durationMin, 0),
      inputs.reduce((a, x) => a + (x.basis?.kind === "sets" ? x.basis.cardioMin : 0), 0),
    );
    const d = dynamicTargets(
      e.energy,
      e.body.weightKg,
      t.dynamic,
      carbsGoodMax(Number(e.body.weightKg), load),
    );
    return { kcal: d.kcal, protein: d.protein, carbs: d.carbs, fat: d.fat };
  }
  if (!t.dynamic && t.targets.kcal) {
    const n = (v: string | null) => (v === null ? 0 : Math.round(Number(v)));
    return {
      kcal: n(t.targets.kcal),
      protein: n(t.targets.protein),
      carbs: n(t.targets.carbs),
      fat: n(t.targets.fat),
    };
  }
  return null;
}

/**
 * The energy target of each day in a range (the week strip): dynamic days
 * included, from what was done and planned on them. Null = no target.
 */
export async function kcalTargets(
  db: Db,
  owner: Owner,
  days: readonly string[],
): Promise<Map<string, number | null>> {
  const rows = await Promise.all(
    days.map(async (day) => {
      const [t, e] = await Promise.all([
        getDayTargets(db, owner, day),
        getDayEnergy(db, owner, day),
      ]);
      return [day, targetsOf(t, e)?.kcal ?? null] as const;
    }),
  );
  return new Map(rows);
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
 * parameters on today's energy. Fixed types show their own numbers.
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
  // With the program's slot, like the day page, so both say the same.
  const slot = await programSlotOn(db, owner, today, today);
  const e = await getDayEnergy(db, owner, today, slot?.slot ?? null);
  if (!e.energy || !e.body.weightKg) return out;
  const inputs = e.energy.inputs.sessions;
  const load = trainingLoad(
    inputs.reduce((a, x) => a + x.durationMin, 0),
    inputs.reduce((a, x) => a + (x.basis?.kind === "sets" ? x.basis.cardioMin : 0), 0),
  );
  for (const p of dynamic) {
    const d = dynamicTargets(
      e.energy,
      e.body.weightKg,
      {
        deficitKcal: p.deficitKcal,
        proteinGPerKg: p.proteinGPerKg,
        fatGPerKg: p.fatGPerKg,
      },
      carbsGoodMax(Number(e.body.weightKg), load),
    );
    out.set(p.id, {
      kcal: d.kcal,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      fiber: d.fiber,
    });
  }
  return out;
}
