/**
 * features/plan/habit-form.ts — a habit's form in words and back (slice
 * d): what (a kind, an activity by its category), how often (every day,
 * some weekdays, N times a week), when and how long. Pure.
 */
import { F } from "@lifeos/kit";
import type { Habit, HabitInput } from "@/core/plans";
import type { Recurrence } from "@/core/engines/time";
import { ACTIVITY, NAMES } from "@/features/day/words";
import { readTime, WEEKDAYS } from "./model-form";

/** What a habit can be: each activity category, then the other kinds. */
export const HABIT_WHAT: { value: string; label: string }[] = [
  ...Object.entries(ACTIVITY).map(([c, label]) => ({ value: "activity:" + c, label })),
  ...["reading", "journal", "chore", "checkin", "steps", "water", "weigh_in"].map(
    (k) => ({
      value: k,
      label: NAMES[k]!,
    }),
  ),
];

export function readHabit(
  form: Record<string, string>,
  weekdays: readonly number[],
): { ok: true; habit: HabitInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = (form["name"] ?? "").trim();
  if (!name) errors["name"] = "Dagli un nome, per esempio «Stretching».";
  const what = form["what"] ?? "";
  if (!HABIT_WHAT.some((w) => w.value === what)) errors["what"] = "Scegli che cosa.";
  const [kind, category] = what.split(":") as [string, string | undefined];
  let recurrence: Recurrence = { type: "daily" };
  if (form["rule"] === "weekdays") {
    const days = [...new Set(weekdays)].filter((d) => d >= 1 && d <= 7).sort();
    if (days.length === 0) errors["rule"] = "Scegli almeno un giorno.";
    recurrence = { type: "weekdays", days };
  } else if (form["rule"] === "times") {
    const n = Number((form["n"] ?? "").replace(",", "."));
    if (!(Number.isInteger(n) && n >= 1 && n <= 7)) errors["n"] = "Da 1 a 7 volte.";
    recurrence = { type: "timesPerWeek", n };
  }
  const atMin = readTime(form["at"]);
  if (Number.isNaN(atMin)) errors["at"] = "Un orario come 18:00.";
  const d = (form["durationMin"] ?? "").trim();
  const durationMin = d === "" ? null : Number(d.replace(",", "."));
  if (durationMin !== null && !(durationMin > 0 && durationMin <= 600))
    errors["durationMin"] = "I minuti, per esempio 30.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    habit: {
      name,
      kind,
      category: category ?? null,
      recurrence,
      atMin,
      durationMin: durationMin === null ? null : Math.round(durationMin),
    },
  };
}

/** «ogni giorno», «L M G», «3 volte a settimana». */
export function ruleWords(r: Recurrence): string {
  switch (r.type) {
    case "daily":
      return "ogni giorno";
    case "weekdays":
      return r.days.length === 5 && r.days.every((d) => d <= 5)
        ? "nei feriali"
        : WEEKDAYS.filter(([d]) => r.days.includes(d))
            .map(([, l]) => l)
            .join(" ");
    case "timesPerWeek":
      return F.plural(r.n, "volta", "volte") + " a settimana";
    case "everyN":
      return "ogni " + r.n + " giorni";
    case "onDates":
      return F.plural(r.dates.length, "data", "date");
  }
}

/** A habit as a row of Modelli. */
export function habitWhat(h: Pick<Habit, "kind" | "category">): string {
  return h.category ? (ACTIVITY[h.category] ?? h.category) : (NAMES[h.kind] ?? h.kind);
}
