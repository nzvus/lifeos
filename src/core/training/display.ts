/**
 * core/training/display.ts — training numbers as short text, the same way
 * everywhere: a set is "10×40" (reps × kg), "×10" (bodyweight), "20 min"
 * (cardio, with speed/incline when known); a list of sets joins with " · ";
 * repeated identical sets collapse ("3×10×40" = 3 sets of 10 at 40 kg),
 * as the developer writes them.
 */
import { formatNumber } from "../shared/format";
import type { Locale } from "../shared/locales";

type SetText = {
  reps: number | null;
  loadKg: string | null;
  loadApprox?: boolean;
  warmup?: boolean;
  durationS?: number | null;
  speedKmh?: string | null;
  inclinePct?: string | null;
};

export function setText(s: SetText, locale: Locale): string {
  if (s.durationS) {
    const parts = [`${Math.round(s.durationS / 60)} min`];
    if (s.speedKmh) parts.push(`${formatNumber(s.speedKmh, locale, 1)} km/h`);
    if (s.inclinePct && Number(s.inclinePct) > 0)
      parts.push(`${formatNumber(s.inclinePct, locale, 0)}%`);
    return parts.join(" ");
  }
  const load =
    s.loadKg === null
      ? null
      : `${formatNumber(s.loadKg, locale, Number(s.loadKg) % 1 ? 1 : 0)}${s.loadApprox ? "~" : ""}`;
  return load === null ? `×${s.reps}` : `${s.reps}×${load}`;
}

/** The working sets of an exercise, collapsed: "3×10×40 · 8×35". */
export function setsText(sets: readonly SetText[], locale: Locale): string {
  const texts = sets.filter((s) => !s.warmup).map((s) => setText(s, locale));
  const out: { text: string; n: number }[] = [];
  for (const t of texts) {
    const last = out.at(-1);
    if (last && last.text === t) last.n++;
    else out.push({ text: t, n: 1 });
  }
  return out
    .map((o) =>
      o.n > 1 && !o.text.startsWith("×") && !o.text.includes("min")
        ? `${o.n}×${o.text}`
        : o.n > 1
          ? `${o.n}${o.text}`
          : o.text,
    )
    .join(" · ");
}
