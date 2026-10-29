/**
 * features/training/present.ts — gym mode's words and numbers (V-05), pure:
 * a set as written ("8 × 60 kg", "45 s"), the last time as one line, the
 * suggested rest of an exercise (E6 `restAfter` on its guide's role), and
 * the step of its load stepper. Numbers through `F` (content.md).
 */
import { F, type BoxEntry, type State } from "@lifeos/kit";
import {
  dumbbellStep,
  e1rm,
  loadStep,
  orderEffect,
  repsAtLoad,
  restAfter,
  vsExpected,
  type LastSet,
  type Role,
  type Trend,
} from "@/core/engines/training";
import type { Score } from "@/core/engines/judgements";
import type { SessionContext } from "@/core/training/context";
import { guideOf } from "@/core/training/plan";

export type SetView = {
  reps: number | null;
  loadKg: string | null;
  durationS: number | null;
  rir?: number | null | undefined;
  /** "per_dumbbell": shown as one dumbbell's load × 2. */
  loadEntry?: string | undefined;
};

const seconds = (s: number) => (s >= 120 ? F.hm(s / 60) : F.num(s, "") + " s");

/** "8 × 60 kg", "12" (bodyweight), "45 s", "8 × 60 kg · RIR 2". */
export function setText(s: SetView, withRir = false): string {
  const base =
    s.durationS !== null && s.reps === null
      ? seconds(s.durationS)
      : (s.reps ?? "–") +
        (s.loadKg === null
          ? ""
          : s.loadEntry === "per_dumbbell"
            ? " × 2 × " + F.num(Number(s.loadKg) / 2, "kg")
            : " × " + F.num(Number(s.loadKg), "kg"));
  return base + (withRir && s.rir != null ? " · RIR " + s.rir : "");
}

/** The last time in one line: "12 ott: 8 · 8 · 7 × 60 kg"; mixed loads set by set. */
export function lastTimeText(day: string, sets: readonly LastSet[]): string {
  const work = sets.filter((s) => !s.warmup);
  if (work.length === 0) return "";
  const loads = new Set(work.map((s) => s.loadKg));
  const same =
    loads.size === 1 && work.every((s) => s.durationS === null || s.reps !== null);
  const body = same
    ? work.map((s) => s.reps ?? "–").join(" · ") +
      (work[0]!.loadKg !== null ? " × " + F.num(Number(work[0]!.loadKg), "kg") : "")
    : work.map((s) => setText(s)).join(", ");
  return "L’ultima volta, " + F.date(day) + ": " + body;
}

/** The role gym mode rests by: its guide's, else a compound's (the longer rest is the safer). */
export function roleOf(pattern: string | null): Role {
  return guideOf(pattern)?.role ?? "compound";
}

/** The suggested rest after a working set, in seconds: low and high. */
export function restFor(
  pattern: string | null,
  reps: number | null,
): { low: number; high: number } {
  return restAfter({ role: roleOf(pattern), reps: reps ?? 10 });
}

/** The load stepper's step: one dumbbell's next size when typed per dumbbell, else E6's plate step. */
export function kgStep(kg: string, perDumbbell = false): number {
  const n = Number(kg.replace(",", "."));
  const x = Number.isFinite(n) ? n : 0;
  return perDumbbell ? dumbbellStep(x * 2) / 2 : loadStep(x);
}

/** Whether an exercise is timed (a plank, a run): its sets are seconds, not reps. */
export function timed(pattern: string | null): boolean {
  return guideOf(pattern)?.progression === "time";
}

/** Whether an exercise is done with dumbbells, from its equipment or its name. */
export function usesDumbbells(name: string, equipment: string | null): boolean {
  return (
    /dumbbell|manubri/i.test(equipment ?? "") ||
    /\b(db|dumbbells?|manubri\w*)\b/i.test(name)
  );
}

/** Where a rest comes from, in words: "tua media", "+30 s: le ripetizioni calavano"… */
export function restSourceText(source: string, change: number): string {
  if (source === "set") return "impostata";
  if (source === "default") return "consigliata";
  if (change > 0) return "tua media +" + change + " s: le ripetizioni calavano";
  if (change < 0) return "tua media " + change + " s: ti avanzavano ripetizioni";
  return "tua media";
}

/** An exercise's trend in one line (dossiers/training.md §6). */
export function trendText(t: Trend): string {
  if (t.state === "few")
    return t.n === 0
      ? ""
      : "Andamento: servono 3 sessioni (ne hai " + t.n + " dal " + F.date(t.since!) + ")";
  const noise = "±" + F.n(t.te * 100, 0) + " %";
  const order =
    t.orderPctPerSet !== null && t.orderPctPerSet < -0.5
      ? " · dopo altre serie per gli stessi muscoli " +
        F.n(t.orderPctPerSet, 1) +
        " % a serie"
      : "";
  if (t.state === "stable") return "Andamento: stabile (rumore " + noise + ")" + order;
  return (
    "Andamento: " +
    (t.state === "rising" ? "in crescita, " : "in calo, ") +
    (t.perMonthPct > 0 ? "+" : "") +
    F.n(t.perMonthPct, 1) +
    " % al mese" +
    order
  );
}

/**
 * A done set against what was proposed for it: "+1 rispetto alla proposta"
 * ("" when as proposed); at another load, brought to the proposed one.
 */
export function vsProposedText(
  done: { reps: number | null; loadKg: string | null },
  proposed: { reps: number | null; loadKg: string | null } | undefined,
): string {
  if (done.reps === null || !proposed || proposed.reps === null) return "";
  const kg = (x: string | null) => (x === null ? null : Number(x));
  const { diff, word } = vsExpected(
    repsAtLoad(done.reps, kg(done.loadKg), kg(proposed.loadKg)),
    proposed.reps,
  );
  if (word === "as") return "";
  return (diff > 0 ? "+" : "") + diff + " rispetto alla proposta";
}

/**
 * What came before the session as the board's pills, each with a state
 * (content.md §3): a night under 7 h, under 1 g/kg-ish of food (< 1 200
 * kcal) in the 24 h, a readiness of 1–2 are «warn»; the rest «info».
 */
export function contextPills(c: SessionContext): { t: string; state: State }[] {
  const p = (t: string, warn: boolean) => ({
    t,
    state: (warn ? "warn" : "info") as State,
  });
  return [
    ...(c.sleptMin !== null ? [p(F.hm(c.sleptMin) + " di sonno", c.sleptMin < 420)] : []),
    ...(c.kcal24h !== null
      ? [p(F.num(c.kcal24h, "kcal") + " nelle 24 h", c.kcal24h < 1200)]
      : []),
    ...(c.carbs3h !== null
      ? [p(F.num(c.carbs3h, "g") + " di carboidrati nelle 3 h", false)]
      : []),
    ...(c.coffees3h > 0
      ? [p(F.plural(c.coffees3h, "caffè", "caffè") + " prima", false)]
      : []),
    ...(c.creatineDays !== null
      ? [p("creatina " + c.creatineDays + " giorni su 28", c.creatineDays < 20)]
      : []),
    ...(c.readiness !== null
      ? [p("come ti sentivi " + c.readiness + "/5", c.readiness <= 2)]
      : []),
  ];
}

/** What came before the session, in one line; "" when nothing was logged. */
export function contextText(c: SessionContext): string {
  const parts = contextPills(c).map((x) => x.t);
  return parts.length ? "Prima: " + parts.join(" · ") : "";
}

/** The best e1RM (with RIR) of the working sets; null without a loaded set of 1–12 reps. */
export function bestE1rm(sets: readonly LastSet[]): number | null {
  const all = sets
    .filter((x) => !x.warmup && x.reps !== null && x.loadKg !== null)
    .map((x) => e1rm(x.reps!, Number(x.loadKg), x.rir ?? null))
    .filter((v): v is number => v !== null);
  return all.length ? Math.max(...all) : null;
}

/**
 * The board's «forza stimata 41 · +2 %»: today's best e1RM of the exercise
 * against its last session's; good when it held or rose, warn when it fell
 * more than 2 % (a day's noise is about that much).
 */
export function strengthPill(
  today: readonly LastSet[],
  lastBest: number | null,
): { t: string; state: State } | null {
  const now = bestE1rm(today);
  if (now === null) return null;
  if (lastBest === null || !(lastBest > 0))
    return { t: "forza stimata " + F.n(now, 1), state: "info" };
  const pct = ((now - lastBest) / lastBest) * 100;
  return {
    t: "forza stimata " + F.n(now, 1) + " · " + F.signed(Math.round(pct), "%"),
    state: pct >= -2 ? "good" : "warn",
  };
}

/** The last rest against the planned one (the board's «riposo 1:20 / 1:30»), warn past ±30 %. */
export function restPill(
  restS: number | null,
  plannedS: number,
): { t: string; state: State } | null {
  if (restS === null) return null;
  const clock = (s: number) =>
    Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0");
  return {
    t: "riposo " + clock(restS) + " / " + clock(plannedS),
    state: Math.abs(restS - plannedS) <= 0.3 * plannedS ? "good" : "warn",
  };
}

const PART_WORDS: Record<string, string> = {
  progression: "progressione",
  volume: "volume",
  effort: "sforzo",
  rests: "recuperi",
};

/**
 * The muscle groups of the catalog (v1's `muscleGroups`) in the six
 * families the boards colour (tokens `--muscle-*`).
 */
const MUSCLE_FAMILY: Record<string, [string, string]> = {
  chest: ["chest", "petto"],
  lats: ["back", "schiena"],
  upper_back: ["back", "schiena"],
  lower_back: ["back", "schiena"],
  traps: ["back", "schiena"],
  front_delts: ["shoulders", "spalle"],
  side_delts: ["shoulders", "spalle"],
  rear_delts: ["shoulders", "spalle"],
  biceps: ["arms", "braccia"],
  triceps: ["arms", "braccia"],
  forearms: ["arms", "braccia"],
  abs: ["core", "core"],
  obliques: ["core", "core"],
  quads: ["legs", "gambe"],
  hamstrings: ["legs", "gambe"],
  glutes: ["legs", "gambe"],
  calves: ["legs", "gambe"],
  adductors: ["legs", "gambe"],
  abductors: ["legs", "gambe"],
};

/** A muscle group in words, for «cosa aggiungere» (session.md §5.4). */
export const MUSCLE_WORDS: Record<string, string> = {
  chest: "petto",
  lats: "dorsali",
  upper_back: "parte alta della schiena",
  lower_back: "lombari",
  traps: "trapezi",
  front_delts: "deltoidi anteriori",
  side_delts: "deltoidi laterali",
  rear_delts: "deltoidi posteriori",
  biceps: "bicipiti",
  triceps: "tricipiti",
  forearms: "avambracci",
  abs: "addome",
  obliques: "obliqui",
  quads: "quadricipiti",
  hamstrings: "femorali",
  glutes: "glutei",
  calves: "polpacci",
  adductors: "adduttori",
  abductors: "abduttori",
};

/**
 * Where the session's working sets went (the board's «La sessione finora»):
 * each set to its exercise's first muscle group's family, as shares of all,
 * largest first. Exercises without groups are left out.
 */
export function muscleSplit(
  xs: readonly { muscles: readonly string[]; sets: number }[],
): { key: string; label: string; pct: number }[] {
  const by = new Map<string, { label: string; sets: number }>();
  for (const x of xs) {
    const fam = MUSCLE_FAMILY[x.muscles[0] ?? ""];
    if (!fam || x.sets <= 0) continue;
    const b = by.get(fam[0]) ?? { label: fam[1], sets: 0 };
    by.set(fam[0], { label: b.label, sets: b.sets + x.sets });
  }
  const all = [...by.values()].reduce((a, b) => a + b.sets, 0);
  return [...by]
    .map(([key, b]) => ({ key, label: b.label, pct: Math.round((b.sets / all) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

/**
 * The session so far as a kit box: its minutes, its score's parts (the
 * skyline; E7 «Training session» on what is done), the muscle split as a
 * strip and pills.
 */
export function sessionBox(
  s: Score,
  minutes: number | null,
  split: readonly { key: string; label: string; pct: number }[],
  done: boolean,
): BoxEntry {
  return {
    fam: "train",
    sub: "strength",
    title: done ? "La sessione" : "La sessione finora",
    ...(minutes !== null ? { value: F.num(minutes, "min") } : {}),
    ...(s.value !== null
      ? {
          score: {
            value: s.value,
            parts: s.parts.map((p) => ({
              name: PART_WORDS[p.key] ?? p.key,
              score: p.score,
              weight: p.weight,
            })),
            missing: s.missing.map((k) =>
              k === "effort"
                ? "sforzo (nessun RIR)"
                : k === "rests"
                  ? "recuperi (non cronometrati)"
                  : (PART_WORDS[k] ?? k),
            ),
          },
        }
      : {}),
    ...(split.length
      ? {
          strip: split.map((m) => ({ w: m.pct, c: "var(--muscle-" + m.key + ")" })),
          pills: split.map((m) => ({ t: m.label + " " + F.num(m.pct, "%") })),
        }
      : {}),
  };
}

/**
 * The order effect on today's exercise (session.md §5.2): «di solito lo fai
 * 1°, oggi 4° · ~−4 %», so a lower number is not read as a regression. The
 * effect is learnt across the person's exercises (`orderEffect`, a place with
 * fewer than three sessions says nothing); the usual place is the one this
 * exercise had most often, from three sessions on. Null when today's place is
 * the usual one or too little is known.
 */
export function orderNote(
  byExercise: ReadonlyMap<string, readonly { place: number; sets: readonly LastSet[] }[]>,
  exerciseId: string,
  today: number,
): string | null {
  const own = byExercise.get(exerciseId) ?? [];
  if (own.length < 3) return null;
  const count = new Map<number, number>();
  for (const s of own) count.set(s.place, (count.get(s.place) ?? 0) + 1);
  const usual = [...count].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0];
  if (usual === today) return null;
  const effect = orderEffect(
    [...byExercise].flatMap(([exercise, ss]) =>
      ss.flatMap((s) => {
        const e1rm = bestE1rm(s.sets);
        return e1rm ? [{ exercise, position: s.place, e1rm }] : [];
      }),
    ),
  );
  const pct = Math.round(((effect.get(today) ?? 1) / (effect.get(usual) ?? 1) - 1) * 100);
  return (
    "di solito lo fai " +
    (usual + 1) +
    "°, oggi " +
    (today + 1) +
    "°" +
    (pct < 0
      ? " · " + F.signed(pct, "%") + " atteso, non un calo"
      : pct > 0
        ? " · " + F.signed(pct, "%") + " atteso"
        : "")
  );
}
