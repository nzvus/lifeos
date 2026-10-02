/**
 * features/training/sessions/TrainingSummary.tsx — the day's training when
 * its card is closed (2026-10-02: "closed, it shows nothing"), as
 * informative as Energy and Day quality: each session with its status, the
 * day's totals as chips with coloured icons (minutes, working sets,
 * tonnage, km, burn), and where the work went by body region (the same bar
 * as each session's, for the whole day). Server component.
 */
import { Circle, CircleCheck, Clock, Flame, Layers, Route, Weight } from "lucide-react";
import type { ReactNode } from "react";
import { regionSplit, sessionSummary } from "@/core/training/display";
import type { SessionView } from "@/core/training/repositories/sessions";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { REGION_BG } from "@/ui/MuscleChip";

export function TrainingSummary({
  sessions,
  burn,
  locale,
  t,
  tx,
}: {
  sessions: SessionView[];
  /** The day's burn, done + planned, already written ("~435–652 kcal"). */
  burn: string | null;
  locale: Locale;
  t: Messages["training"];
  tx: Pick<Messages["exercises"], "regions">;
}) {
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const all = sessions.map((s) => sessionSummary(s));
  const minutes = sessions.reduce(
    (a, s, i) => a + (all[i]!.cardio?.minutes ?? all[i]!.minutes ?? s.durationMin ?? 0),
    0,
  );
  const sets = all.reduce((a, x) => a + (x.strength?.sets ?? 0), 0);
  const tonnage = all.reduce((a, x) => a + (x.strength?.tonnage ?? 0), 0);
  const km = all.reduce((a, x) => a + (x.cardio?.km ?? 0), 0);
  const split = regionSplit({ exercises: sessions.flatMap((s) => s.exercises) });
  const chip = (icon: ReactNode, text: string, label: string) => (
    <span key={label} title={label} className="inline-flex items-center gap-1">
      {icon}
      <span className="sr-only">{label}</span>
      {text}
    </span>
  );
  return (
    <div className="flex flex-col gap-2 text-meta">
      <p className="flex flex-wrap gap-x-3 gap-y-0.5">
        {sessions.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1 font-semibold">
            {s.status === "done" ? (
              <CircleCheck size={14} aria-label={t.statuses.done} className="text-herb" />
            ) : (
              <Circle size={14} aria-label={t.statuses.planned} className="text-muted" />
            )}
            {s.label}
          </span>
        ))}
      </p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-display font-semibold tabular-nums">
        {minutes > 0 &&
          chip(
            <Clock size={14} aria-hidden="true" className="text-muscle-core" />,
            fill(t.minutesShort, { n: String(minutes) }),
            t.chips.duration,
          )}
        {sets > 0 &&
          chip(
            <Layers size={14} aria-hidden="true" className="text-muscle-back" />,
            fill(t.progress.setsN, { n: String(sets) }),
            t.chips.sets,
          )}
        {tonnage > 0 &&
          chip(
            <Weight size={14} aria-hidden="true" className="text-muscle-chest" />,
            tonnage >= 1000 ? `${n(tonnage / 1000, 1)} t` : `${n(tonnage)} kg`,
            t.chips.tonnage,
          )}
        {km > 0 &&
          chip(
            <Route size={14} aria-hidden="true" className="text-muscle-legs" />,
            `${n(km, 1)} km`,
            t.chips.distance,
          )}
        {burn &&
          chip(
            <Flame size={14} aria-hidden="true" className="text-warn" />,
            burn,
            t.chips.burn,
          )}
      </p>
      {split.length > 0 && (
        <>
          <span
            className="flex h-2 w-full overflow-hidden rounded-badge bg-hairline"
            aria-hidden="true"
          >
            {split.map((r) => (
              <span
                key={r.region}
                className={`h-full ${REGION_BG[r.region]}`}
                style={{ width: `${r.share * 100}%` }}
              />
            ))}
          </span>
          <span className="flex flex-wrap gap-x-3 text-muted">
            {split.map((r) => (
              <span key={r.region} className="inline-flex items-center gap-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${REGION_BG[r.region]}`}
                />
                {`${tx.regions[r.region]} ${Math.round(r.share * 100)} %`}
              </span>
            ))}
          </span>
        </>
      )}
    </div>
  );
}
