/**
 * features/nutrition/log/DayChips.tsx — the day's quick facts as chips
 * under the goal (2026-10-02): the night's sleep, the day's movement and
 * how the day feels (ADR-0038).
 * Each says its value, or invites to add it, and opens its sheet
 * (#day-sleep, #day-move) — the forms live there, not on the page.
 */
import { Brain, Footprints, Moon } from "lucide-react";
import type { ReactNode } from "react";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

export function DayChips({
  mood,
  sleptHours,
  activity,
  locale,
  t,
}: {
  /** The day's mood (ADR-0038), 1–5; null = not said. */
  mood: number | null;
  sleptHours: number | null;
  activity: { level: string; walkingMin: number | null; steps: number | null } | null;
  locale: Locale;
  t: Pick<Messages, "dayChips" | "energy" | "mind">;
}) {
  const c = t.dayChips;
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const move = !activity
    ? null
    : activity.steps
      ? fill(c.steps, { n: n(activity.steps) })
      : activity.walkingMin
        ? fill(c.walk, { n: n(activity.walkingMin) })
        : (t.energy.levels[activity.level as keyof Messages["energy"]["levels"]] ?? null);
  const chip = (href: string, icon: ReactNode, text: string, empty: boolean) => (
    <a
      href={href}
      className={`tile inline-flex items-center gap-1.5 rounded-badge px-3 py-1.5 text-meta ${
        empty ? "text-muted" : "font-semibold"
      }`}
    >
      {icon}
      {text}
    </a>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {chip(
        "#day-sleep",
        <Moon size={16} aria-hidden="true" />,
        sleptHours === null ? c.sleepNone : fill(c.sleep, { h: n(sleptHours, 1) }),
        sleptHours === null,
      )}
      {chip(
        "#day-move",
        <Footprints size={16} aria-hidden="true" />,
        move ?? c.moveNone,
        !activity || (!activity.steps && !activity.walkingMin),
      )}
      {chip(
        "#day-mind",
        <Brain size={16} aria-hidden="true" />,
        mood === null ? t.mind.chipNone : fill(t.mind.chip, { n: String(mood) }),
        mood === null,
      )}
    </div>
  );
}
