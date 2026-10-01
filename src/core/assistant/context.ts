/**
 * core/assistant/context.ts — the whole picture the assistant gets at every
 * turn, as compact text: who the user is, what they have (meals, the
 * ingredients they use, routines, pantry), and what they did — the last 14
 * days in detail, the 12 weeks before as weekly averages. So it can answer
 * in terms of THEIR meals and routines without first calling tools, and
 * still call them for exact data. Built on read, never stored.
 */
import type { Db } from "../db/client";
import { getCalibration, getDayEnergy } from "../energy/repositories/energy";
import { goalOf } from "../energy/energy";
import type { Owner } from "../identity/owner";
import { getHistory } from "../nutrition/repositories/history";
import { listIngredients } from "../nutrition/repositories/ingredients";
import { listMeals } from "../nutrition/repositories/meals";
import { getDayTargets } from "../nutrition/repositories/profiles";
import { getUsage } from "../nutrition/repositories/usage";
import { getPantry } from "../pantry/repositories/stock";
import { addDays } from "../shared/dates";
import { sessionMinutes, sessionTonnage } from "../training/analysis";
import { listMeasurements } from "../training/repositories/measurements";
import { isRest } from "../training/program";
import { getActivePlan } from "../training/repositories/programs";
import { listRoutines } from "../training/repositories/routines";
import { listSessions } from "../training/repositories/sessions";

const DETAIL_DAYS = 14;
const WEEKS = 12;
const r = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "–" : String(Math.round(Number(v)));

export async function userContext(db: Db, owner: Owner, today: string): Promise<string> {
  const from = addDays(today, -(DETAIL_DAYS + WEEKS * 7));
  const [
    history,
    sessions,
    measurements,
    meals,
    ingredients,
    usage,
    routines,
    pantry,
    targets,
    energy,
    calibration,
  ] = await Promise.all([
    getHistory(db, owner, from, today),
    listSessions(db, owner, from, addDays(today, 14)),
    listMeasurements(db, owner),
    listMeals(db, owner),
    listIngredients(db, owner),
    getUsage(db, owner, addDays(today, -60)),
    listRoutines(db, owner),
    getPantry(db, owner),
    getDayTargets(db, owner, today),
    getDayEnergy(db, owner, today),
    getCalibration(db, owner, today),
  ]);
  const out: string[] = [
    "# The user's data (read-only summary; use tools for exact values or other days)",
  ];

  // Body and goal.
  const weights = measurements.filter((m) => m.weightKg !== null);
  const last = weights.at(-1);
  const b = energy.body;
  out.push(
    `## Body\nsex ${b.sex ?? "?"}, born ${b.birthYear ?? "?"}, ${b.heightCm ?? "?"} cm; ` +
      `weight ${last ? `${r(last.weightKg)} kg on ${last.day}` : "never recorded"}` +
      (weights.length > 1
        ? `; earlier: ${weights
            .slice(-6, -1)
            .map((m) => `${m.day} ${r(m.weightKg)}`)
            .join(", ")}`
        : "") +
      (calibration.trendKgPerWeek !== null
        ? `; trend ${calibration.trendKgPerWeek} kg/week`
        : ""),
  );
  if (targets.source !== "none") {
    const d = targets.dynamic;
    const goal = d ? (goalOf(d) ?? "custom") : null;
    out.push(
      `## Today's day type: ${targets.name}` +
        (d
          ? ` (dynamic, goal ${goal}: ${d.deficitKcal >= 0 ? `deficit ${d.deficitKcal}` : `surplus ${-d.deficitKcal}`} kcal, protein ${d.proteinGPerKg} g/kg, fat ${d.fatGPerKg} g/kg)`
          : ` (fixed: ${r(targets.targets.kcal)} kcal, P ${r(targets.targets.protein)} C ${r(targets.targets.carbs)} F ${r(targets.targets.fat)})`),
    );
  }
  if (energy.energy)
    out.push(
      `## Today's energy estimate: ${energy.energy.total.done.low}–${energy.energy.total.done.high} kcal so far, ` +
        `${energy.energy.total.withPlan.low}–${energy.energy.total.withPlan.high} with the plan (activity level ${energy.activity.level})`,
    );

  // Last days in detail.
  const recent = history.filter((h) => h.day > addDays(today, -DETAIL_DAYS));
  const sessionsOn = (day: string) =>
    sessions
      .filter((s) => s.day === day)
      .map((s) => `${s.label}${s.status === "planned" ? " (planned)" : ""}`);
  out.push(
    `## Last ${DETAIL_DAYS} days (eaten kcal / protein / carbs / fat g; training)\n` +
      recent
        .map((h) => {
          const n = h.totals.nutrients;
          const tr = sessionsOn(h.day);
          return (
            `${h.day}: ${h.logged ? `${r(n.kcal)} / ${r(n.protein)} / ${r(n.carbs)} / ${r(n.fat)}` : "nothing logged"}` +
            (h.targets?.kcal ? ` (target ${r(h.targets.kcal)})` : "") +
            (tr.length ? `; ${tr.join(", ")}` : "")
          );
        })
        .join("\n"),
  );

  // Older weeks as averages over logged days.
  const weeks: string[] = [];
  for (let w = 0; w < WEEKS; w++) {
    const end = addDays(today, -DETAIL_DAYS - w * 7);
    const start = addDays(end, -6);
    const days = history.filter((h) => h.day >= start && h.day <= end && h.logged);
    const done = sessions.filter(
      (s) => s.status === "done" && s.day >= start && s.day <= end,
    );
    if (!days.length && !done.length) continue;
    const avg = (k: "kcal" | "protein") =>
      days.length
        ? r(days.reduce((a, h) => a + Number(h.totals.nutrients[k]), 0) / days.length)
        : "–";
    weeks.push(
      `week to ${end}: ${days.length} days logged, avg ${avg("kcal")} kcal, ${avg("protein")} g protein; ${done.length} sessions`,
    );
  }
  if (weeks.length) out.push(`## Earlier weeks\n${weeks.join("\n")}`);

  // What they eat.
  const usesOf = (id: string) => usage.meals[id]?.uses ?? 0;
  out.push(
    `## My meals (per serving: kcal, protein g; times logged in 60 days)\n` +
      [...meals]
        .sort((a, b) => usesOf(b.id) - usesOf(a.id))
        .map(
          (m) =>
            `${m.name}: ${r(m.totals.nutrients.kcal)} kcal, ${r(m.totals.nutrients.protein)} P, ×${usesOf(m.id)} — ` +
            m.lines
              .map((l) => `${l.ingredientName} ${r(l.quantity)}${l.unit}`)
              .join(", "),
        )
        .join("\n"),
  );
  const ingUses = (id: string) => usage.ingredients[id]?.uses ?? 0;
  out.push(
    `## My ingredients, most used first (per 100 g/ml: kcal, P, C, F)\n` +
      [...ingredients]
        .sort((a, b) => ingUses(b.id) - ingUses(a.id))
        .slice(0, 40)
        .map(
          (i) => `${i.name}: ${r(i.kcal)}, ${r(i.protein)}, ${r(i.carbs)}, ${r(i.fat)}`,
        )
        .join("\n"),
  );

  // How they train.
  out.push(
    `## My routines\n` +
      routines
        .map((rt) => `${rt.name}: ${rt.items.map((it) => it.name).join(", ")}`)
        .join("\n"),
  );
  const done = sessions.filter((s) => s.status === "done").slice(-10);
  if (done.length)
    out.push(
      `## Last sessions\n` +
        done
          .map(
            (s) =>
              `${s.day} ${s.label}: ${sessionMinutes(s) ?? "?"} min` +
              (s.exercises.length
                ? `, ${s.exercises.length} exercises, ${r(sessionTonnage(s.exercises))} kg lifted`
                : ""),
          )
          .join("\n"),
    );
  const program = await getActivePlan(db, owner, today, 7);
  if (program)
    out.push(
      `## Training program "${program.program.name}" (cycle: ${program.program.slots.map((x) => x.name || "rest").join(" → ")})\n` +
        program.plan
          .map((d) => {
            const name = program.program.slots.find(
              (x) => x.position === d.slot.position,
            )?.name;
            return `${d.day}: ${isRest(d.slot) ? "rest" : name}${d.late ? " (late: was due earlier)" : ""}`;
          })
          .join("\n"),
    );
  const planned = sessions.filter((s) => s.status === "planned" && s.day >= today);
  if (planned.length)
    out.push(
      `## Planned training\n${planned.map((s) => `${s.day} ${s.label}`).join("\n")}`,
    );

  // At home.
  const stock = pantry.filter((p) => Number(p.quantity) > 0);
  if (stock.length)
    out.push(
      `## At home\n` +
        stock
          .map(
            (p) =>
              `${p.name}: ${r(p.quantity)} ${p.unit}${p.daysLeft !== null ? ` (~${p.daysLeft} days)` : ""}`,
          )
          .join("\n"),
    );
  return out.join("\n\n");
}
