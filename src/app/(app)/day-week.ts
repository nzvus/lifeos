/**
 * app/(app)/day-week.ts — the day page's words for its training burn, its
 * week read for the week panel (ADR-0047) and its slots (ADR-0044). Split
 * out of page.tsx
 * (800-line limit).
 */
import type { ResolvedDay } from "@/core/day/resolve";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import { weekContext, type WeekContext } from "@/core/nutrition/week";
import { minutesOf, type MomentBounds } from "@/core/nutrition/moments";
import {
  defaultSlots,
  type TimelineEvent,
  type TimelineSession,
} from "@/core/day/timeline";
import type { DayProgram, ProgramSlot } from "@/core/nutrition/programs";
import { moveWithSession, withoutTraining } from "@/core/nutrition/slots";
import { timeIn } from "@/core/shared/dates";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { dayBurn } from "@/core/training/progress";
import { fill, type Messages } from "@/i18n";

type Range = { low: number; high: number };

/** The day's training burn as ranges: done, then with the planned sessions. */
export function burnWords(
  burn: ReturnType<typeof dayBurn>,
  locale: Locale,
  t: Messages["training"],
): { text: string; range: string | null } {
  const range = (r: Range) => ({ low: String(r.low), high: String(r.high) });
  const n = (v: number) => formatNumber(String(v), locale, 0);
  return {
    text: [
      burn.done && fill(t.burn, range(burn.done)),
      burn.withPlanned &&
        burn.withPlanned.high !== burn.done?.high &&
        fill(t.burnWithPlanned, range(burn.withPlanned)),
    ]
      .filter(Boolean)
      .join(" · "),
    range: burn.withPlanned
      ? `~${n(burn.withPlanned.low)}–${n(burn.withPlanned.high)} kcal`
      : null,
  };
}

/** The shown day in its calendar week, through the one engine's targets. */
export function weekOf(
  week: readonly DaySummary[],
  days: ReadonlyMap<string, ResolvedDay>,
  day: string,
): WeekContext {
  return weekContext(
    week.map((d) => {
      const r = days.get(d.day);
      return {
        day: d.day,
        logged: d.totals.nutrients.kcal !== "0",
        eaten: d.totals.nutrients,
        targets: r?.targets ?? null,
        proteinLow: r?.bands?.protein?.low ?? null,
      };
    }),
    day,
    days.get(day)?.energy.energy?.bmr ?? null, // the floor holds here too
  );
}

/**
 * The day's program slots, the ones around training moved to the session's
 * real start when one started at another time (ADR-0044).
 */
export function daySlots(
  program: DayProgram | undefined,
  sessions: readonly { startedAt: string | null }[],
  timeZone: string,
  bounds: MomentBounds,
  training: boolean,
): ProgramSlot[] {
  // ADR-0050: without a program, the main meals at their usual times.
  if (!program || !program.slots.length) return defaultSlots(bounds);
  const starts = sessions
    .filter((x) => x.startedAt)
    .map((x) => minutesOf(timeIn(new Date(x.startedAt!), timeZone)));
  return moveWithSession(
    training ? program.slots : withoutTraining(program.slots),
    program.trainingAt,
    starts.length ? Math.min(...starts) : null,
  );
}

/** The day's sessions for the timeline: their real start, else the program's time. */
export function timelineSessions(
  sessions: readonly {
    id: string;
    label: string;
    status: string;
    startedAt: string | null;
  }[],
  program: DayProgram | undefined,
  timeZone: string,
): TimelineSession[] {
  return sessions.map((x) => ({
    id: x.id,
    label: x.label,
    status: x.status === "done" ? "done" : "planned",
    at: x.startedAt
      ? minutesOf(timeIn(new Date(x.startedAt), timeZone))
      : (program?.trainingAt ?? null),
  }));
}

/**
 * Everything the day's timeline needs (ADR-0050), in one place: the
 * slots (the program's, moved with the session, or the usual meals), the
 * day's targets for their shares, the sessions, now and whether the day is
 * over. Split out of page.tsx (800-line limit).
 */
export function timelineOf(input: {
  program: DayProgram | undefined;
  sessions: readonly {
    id: string;
    label: string;
    status: string;
    startedAt: string | null;
  }[];
  day: string;
  today: string;
  timeZone: string;
  bounds: MomentBounds;
  targets: { kcal: string | null; protein: string | null };
  weightKg: string | null;
  /** The program has a session on this day, not skipped. */
  programTraining: boolean;
}) {
  const num = (x: string | null) => (x === null ? null : Number(x));
  return {
    slots: daySlots(
      input.program,
      input.sessions,
      input.timeZone,
      input.bounds,
      input.sessions.length > 0 || input.programTraining,
    ),
    slotDay: {
      kcal: num(input.targets.kcal),
      protein: num(input.targets.protein),
      kg: num(input.weightKg),
    },
    sessions: timelineSessions(input.sessions, input.program, input.timeZone),
    now: input.day === input.today ? minutesOf(timeIn(new Date(), input.timeZone)) : null,
    over: input.day < input.today,
  };
}

/**
 * 2026-10-11: the rest of the day's log on the timeline — waking (the night
 * that ended this day), the day's weigh-in (its own time, else just after
 * waking, else 07:00) and money moved (when it was entered, if that day,
 * else midday).
 */
export function timelineEvents(input: {
  day: string;
  timeZone: string;
  locale: Locale;
  night: { wakeAt: Date; hours: number } | null;
  weighIns: readonly {
    id: string;
    day: string;
    weightKg: string | null;
    context: { measuredAt: Date | null } | null;
  }[];
  movements: readonly {
    id: string;
    day: string;
    amountCents: number;
    description: string;
    shop: string;
    createdAt: Date;
  }[];
  t: Messages["dayProgram"]["timeline"];
}): TimelineEvent[] {
  const at = (d: Date) => minutesOf(timeIn(d, input.timeZone));
  const sameDay = (d: Date) =>
    d.toLocaleDateString("sv-SE", { timeZone: input.timeZone }) === input.day;
  const n = (v: number, d = 0) => formatNumber(String(v), input.locale, d);
  const out: TimelineEvent[] = [];
  const wake = input.night ? at(input.night.wakeAt) : null;
  if (input.night)
    out.push({
      id: "wake",
      kind: "wake",
      at: wake!,
      text: fill(input.t.woke, { h: n(Math.round(input.night.hours * 10) / 10, 1) }),
    });
  for (const w of input.weighIns)
    if (w.day === input.day && w.weightKg)
      out.push({
        id: w.id,
        kind: "weigh",
        at: w.context?.measuredAt ? at(w.context.measuredAt) : (wake ?? 7 * 60) + 1,
        text: fill(input.t.weighed, { kg: n(Number(w.weightKg), 1) }),
      });
  for (const m of input.movements)
    out.push({
      id: m.id,
      kind: "money",
      at: sameDay(m.createdAt) ? at(m.createdAt) : 12 * 60,
      text: fill(m.amountCents < 0 ? input.t.moneyOut : input.t.moneyIn, {
        what: m.description || m.shop || input.t.moneyNoName,
        amount: formatCents(Math.abs(m.amountCents), input.locale),
      }),
      href: `/money/${m.id}?from=${encodeURIComponent(`/?day=${input.day}`)}`,
    });
  return out;
}
