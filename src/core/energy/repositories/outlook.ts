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
import { getDayTargets } from "../../nutrition/repositories/profiles";
import { addDays } from "../../shared/dates";
import { getActivePlan } from "../../training/repositories/programs";
import { listSessions } from "../../training/repositories/sessions";
import { dynamicTargets, goalOf, type Goal, type Range } from "../energy";
import { getDayEnergy } from "./energy";

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
    let targets: OutlookDay["targets"] = null;
    if (t.source !== "none") {
      if (t.dynamic && e.energy && e.body.weightKg) {
        const inputs = e.energy.inputs.sessions;
        const load = trainingLoad(
          inputs.reduce((a, x) => a + x.durationMin, 0),
          inputs.reduce(
            (a, x) => a + (x.basis?.kind === "sets" ? x.basis.cardioMin : 0),
            0,
          ),
        );
        const d = dynamicTargets(
          e.energy,
          e.body.weightKg,
          t.dynamic,
          carbsGoodMax(Number(e.body.weightKg), load),
        );
        targets = { kcal: d.kcal, protein: d.protein, carbs: d.carbs, fat: d.fat };
      } else if (!t.dynamic && t.targets.kcal) {
        const n = (v: string | null) => (v === null ? 0 : Math.round(Number(v)));
        targets = {
          kcal: n(t.targets.kcal),
          protein: n(t.targets.protein),
          carbs: n(t.targets.carbs),
          fat: n(t.targets.fat),
        };
      }
    }
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
