/**
 * features/progress/goal-rows.ts — each goal as the board Goals draws it
 * (dossiers/fidelity.md): a row with its family's drawing, what it is in
 * the title, where it stands in the value («76,3 → 72,3 kg», «4 su 5»),
 * one line of how it goes, a strip (how far along, or the week's days
 * coloured), pills (in line or not, what today asks), a link to where it is
 * logged. A goal nothing counts yet is faded, «nessun dato». Pure.
 */
import { F, type BoxEntry, type State } from "@lifeos/kit";
import type { Goal, WeightProgress } from "@/core/goals";
import { goalText, goalTitle } from "./goals";

export type GoalProgress =
  | { type: "weight"; p: WeightProgress | null }
  | {
      type: "days";
      /** Monday to Sunday of this week; n null when not logged, future for days to come. */
      days: { day: string; n: number | null; future: boolean; counts: boolean }[];
    }
  | { type: "hours"; minutes: number }
  | null;

const FAM: Record<string, { fam: string; sub?: string }> = {
  weight: { fam: "body", sub: "weight" },
  weightRatePctWeek: { fam: "body", sub: "weight" },
  steps: { fam: "habit", sub: "steps" },
  study: { fam: "mind", sub: "study" },
};
const HREF: Record<string, string> = {
  weight: "/andamento",
  steps: "/oggi",
  study: "/oggi",
};

const kgWeek = (x: number) => F.signed(Math.round(x * 100) / 100, "kg/sett.");

export function goalRow(
  g: Goal,
  prog: GoalProgress,
  /** What today asks, for a weight goal's «da qui» pill; null when unknown. */
  today: { kcal: number; protein: number | null } | null = null,
): BoxEntry {
  const base: BoxEntry = {
    ...(FAM[g.source] ?? { fam: "goal" }),
    title:
      goalTitle(g) +
      (g.value !== null && g.source !== "weight" ? ": " + goalText(g) : ""),
    ...(HREF[g.source]
      ? { href: HREF[g.source]!, hrefLabel: "Apri " + goalTitle(g).toLowerCase() }
      : {}),
  };
  if (prog === null)
    return {
      ...base,
      value: "nessun dato",
      meta: "si conta quando c’è il suo tracker",
      faded: true,
    };

  if (prog.type === "weight") {
    const p = prog.p;
    if (!p)
      return {
        ...base,
        value: "—",
        meta: goalText(g) + " · nessuna pesata negli ultimi 7 giorni",
      };
    const state: State | null = p.onTrack === null ? null : p.onTrack ? "good" : "warn";
    return {
      ...base,
      value: F.n(p.now, 1) + " → " + F.num(p.target, "kg"),
      meta: [
        g.by ? "entro il " + F.dateLong(g.by) : "",
        p.needed !== null ? "servono " + kgWeek(p.needed) : "",
        p.pace !== null ? "vai a " + kgWeek(p.pace) : "servono 4 pesate per il ritmo",
        p.eta ? "arrivo ≈ " + F.dateLong(p.eta) : "",
      ]
        .filter(Boolean)
        .join(" · "),
      ...(p.done !== null
        ? { strip: [{ w: Math.round(p.done * 100), c: F.tone("good") }] }
        : {}),
      pills: [
        ...(today
          ? [
              {
                t:
                  "da qui: " +
                  F.num(today.kcal, "kcal") +
                  (today.protein ? " e " + F.num(today.protein, "g") : "") +
                  " al giorno",
              },
            ]
          : []),
        ...(state ? [{ t: state === "good" ? "in linea" : "fuori ritmo", state }] : []),
      ],
    };
  }

  if (prog.type === "days") {
    const target = g.value ?? 0;
    const counted = prog.days.filter((d) => d.counts && !d.future);
    const hit = counted.filter((d) => d.n !== null && d.n >= target);
    const short = counted.filter((d) => d.n !== null && d.n < target);
    return {
      ...base,
      value: hit.length + " su " + counted.length,
      meta:
        "questa settimana" +
        (short.length
          ? " · sotto " +
            short.map((d) => F.day(d.day) + " (" + F.n(d.n!, 0) + ")").join(", ")
          : ""),
      strip: prog.days
        .filter((d) => d.counts)
        .map((d) => ({
          w: Math.round(100 / prog.days.filter((x) => x.counts).length),
          c:
            d.future || d.n === null
              ? "var(--hairline)"
              : F.tone(d.n >= target ? "good" : "warn"),
        })),
      ...(counted.length > 0 && hit.length === counted.length
        ? { pills: [{ t: "in linea", state: "good" as State }] }
        : {}),
    };
  }

  const target = (g.value ?? 0) * 60;
  return {
    ...base,
    value: F.hm(prog.minutes) + " di " + F.hm(target),
    meta: "questa settimana",
    ...(target > 0
      ? {
          strip: [
            {
              w: Math.min(100, Math.round((prog.minutes / target) * 100)),
              c: F.tone(prog.minutes >= target ? "good" : "warn"),
            },
          ],
        }
      : {}),
  };
}

/** This week, Monday to Sunday, each day's count summed (several entries add up). */
export function weekDays(
  counts: readonly { day: string; n: number }[],
  today: string,
  weekdaysOnly: boolean,
): Extract<GoalProgress, { type: "days" }>["days"] {
  const t = new Date(today + "T00:00:00Z").getUTCDay();
  const monday = new Date(Date.parse(today) - ((t + 6) % 7) * 864e5);
  const by = new Map<string, number>();
  for (const c of counts) by.set(c.day, (by.get(c.day) ?? 0) + c.n);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday.getTime() + i * 864e5).toISOString().slice(0, 10);
    return {
      day,
      n: by.get(day) ?? null,
      future: day > today,
      counts: !weekdaysOnly || i < 5,
    };
  });
}
