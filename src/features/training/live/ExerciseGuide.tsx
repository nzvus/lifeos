/**
 * features/training/live/ExerciseGuide.tsx — an exercise's guide
 * (ADR-0028): "Today: 3 × 10–12 × 42.5 kg — every set reached 12 last
 * time" from core/training/targets, then a native <details> "How to" with
 * the usual numbers, warm-up, technique cues and common mistakes.
 * No hooks: it renders in gym mode (client) and on the exercise page (server).
 */
import { BookOpen, Target as TargetIcon } from "lucide-react";
import { GUIDES, type GuideKey } from "@/core/training/guides";
import type { Target } from "@/core/training/targets";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

export function targetText(
  target: Target,
  t: Messages["guides"],
  locale: Locale,
): string {
  const r = t.reasons;
  const sets = String(target.sets);
  if (!("reps" in target)) {
    if (target.minutes !== undefined)
      return fill(target.reason === "add_time" ? r.add_time_min : r.hold_time_min, {
        min: String(target.minutes),
      });
    return fill(target.reason === "add_time" ? r.add_time_s : r.hold_time_s, {
      sets,
      s: String(target.seconds ?? 0),
    });
  }
  const [lo, hi] = target.reps;
  const v = { sets, lo: String(lo), hi: String(hi) };
  if (!("loadKg" in target)) return fill(r.start, v);
  if (target.loadKg === null)
    return fill(target.reason === "add_load" ? r.add_load_bw : r.add_reps_bw, v);
  const kg = formatNumber(
    target.loadKg,
    locale,
    Number.isInteger(Number(target.loadKg)) ? 0 : 1,
  );
  return fill(r[target.reason], { ...v, kg });
}

export function ExerciseGuide({
  guideKey,
  target,
  best,
  locale,
  t,
}: {
  guideKey: GuideKey | null;
  target: Target | null;
  best?: { reps: number; kg: number; e1rm: number } | null;
  locale: Locale;
  t: Messages["guides"];
}) {
  const g = guideKey ? GUIDES[guideKey] : null;
  const words = guideKey ? t.patterns[guideKey] : null;
  const n = (x: number) => formatNumber(String(x), locale, Number.isInteger(x) ? 0 : 1);
  const rest = g
    ? g.restS[1] >= 120
      ? `${g.restS[0] / 60}–${g.restS[1] / 60} min`
      : `${g.restS[0]}–${g.restS[1]} s`
    : "";
  return (
    <div className="flex flex-col gap-1.5 text-meta">
      {target && (
        <p className="flex items-start gap-1.5">
          <TargetIcon
            size={16}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-herb"
          />
          <span>
            <span className="font-semibold">{t.todayLabel}</span>
            {targetText(target, t, locale)}
          </span>
        </p>
      )}
      {best && (
        <p className="text-muted tabular-nums">
          {fill(t.best, { reps: String(best.reps), kg: n(best.kg), e1rm: n(best.e1rm) })}
        </p>
      )}
      {g && words && (
        <details>
          <summary className="inline-flex cursor-pointer items-center gap-1.5 text-muted">
            <BookOpen size={16} aria-hidden="true" />
            {t.title}
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <p className="tabular-nums">
              {g.progression === "time"
                ? fill(t.numbersTime, {
                    reps:
                      g.role === "cardio"
                        ? `${g.reps[0]}–${g.reps[1]} min`
                        : `${g.reps[0]}–${g.reps[1]} s`,
                  })
                : fill(t.numbers, {
                    sets: `${g.sets[0]}–${g.sets[1]}`,
                    reps: `${g.reps[0]}–${g.reps[1]}`,
                    rest,
                  })}
            </p>
            {g.role !== "cardio" && <p>{g.warmup ? t.warmupYes : t.warmupNo}</p>}
            <div>
              <p className="font-semibold">{t.cues}</p>
              <ul className="list-disc pl-5">
                {words.cues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">{t.mistakes}</p>
              <ul className="list-disc pl-5">
                {words.mistakes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <p className="text-muted">{t.note}</p>
          </div>
        </details>
      )}
    </div>
  );
}
