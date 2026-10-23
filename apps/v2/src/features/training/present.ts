/**
 * features/training/present.ts — gym mode's words and numbers (V-05), pure:
 * a set as written ("8 × 60 kg", "45 s"), the last time as one line, the
 * suggested rest of an exercise (E6 `restAfter` on its guide's role), and
 * the step of its load stepper. Numbers through `F` (content.md).
 */
import { F } from "@lifeos/kit";
import {
  loadStep,
  restAfter,
  vsExpected,
  type LastSet,
  type Role,
  type Trend,
} from "@/core/engines/training";
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

/** The load stepper's step: E6's plate step at that load. */
export function kgStep(kg: string): number {
  const n = Number(kg.replace(",", "."));
  return loadStep(Number.isFinite(n) ? n : 0);
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

/** A done set against what was proposed for it: "+1 rispetto alla proposta"; "" when as proposed. */
export function vsProposedText(done: number | null, proposed: number | null): string {
  if (done === null || proposed === null) return "";
  const { diff, word } = vsExpected(done, proposed);
  if (word === "as") return "";
  return (diff > 0 ? "+" : "") + diff + " rispetto alla proposta";
}
