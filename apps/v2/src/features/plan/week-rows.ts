/**
 * features/plan/week-rows.ts — Piano's week as the board Plan draws it: one
 * row per day, «Rec» + the cycle's step in the title, what happened on a
 * past day (the sessions done) or what is planned on a coming one (the
 * step, the planned entries, the day's kcal), each opening its day. Pure.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import type { DayPlan } from "@/core/plans";

export function dayRow(p: {
  day: string;
  today: string;
  plan: DayPlan | undefined;
  /** The sessions done that day, by name. */
  sessions: string[];
  /** Entries still planned that day. */
  planned: number;
  kcal: number | null;
  selected: boolean;
}): BoxEntry {
  const past = p.day < p.today;
  const step = p.plan?.cycles.find((c) => !c.rest) ?? null;
  const rest = (p.plan?.cycles.length ?? 0) > 0 && !step;
  const model = p.plan?.model?.name ?? null;
  const trains = past ? p.sessions.length > 0 : !!step;
  const label = F.Day(p.day);
  return {
    fam: trains ? "train" : "day",
    ...(trains ? { sub: "strength" } : {}),
    time: F.dayShort(p.day),
    title:
      [
        model ? "«" + model + "»" : "",
        past ? p.sessions.join(" + ") : step ? step.label : rest ? "Riposo" : "",
      ]
        .filter(Boolean)
        .join(" + ") || "Senza modello",
    value: past
      ? p.sessions.length
        ? "fatto"
        : "riposo"
      : p.day === p.today
        ? "oggi"
        : "previsto",
    meta: [
      past
        ? p.sessions.length
          ? F.plural(p.sessions.length, "allenamento fatto", "allenamenti fatti")
          : "nessun allenamento"
        : step
          ? step.label +
            " dal ciclo " +
            step.cycle +
            (step.skipped ? " (saltato)" : step.late ? " (in ritardo)" : "")
          : rest
            ? "riposo dal ciclo"
            : "",
      p.planned ? F.plural(p.planned, "previsto", "previsti") : "",
      p.kcal ? F.num(p.kcal, "kcal") : "",
      p.plan?.model?.from === "day" ? "cambiato solo qui" : "",
    ]
      .filter(Boolean)
      .join(" · "),
    planned: !past,
    faded: past,
    href: "/oggi/piano?giorno=" + p.day,
    hrefLabel: "Apri " + label + (p.selected ? " (aperto)" : ""),
  };
}
