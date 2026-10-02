/**
 * app/(app)/plan/page.tsx — URL /plan[?month=YYYY-MM], the Plan tab
 * (ADR-0035): the month as a calendar — sessions done and planned, and
 * from today on what the active program puts on each day — then the coming
 * days of the program, changeable one at a time (ADR-0029). Replaces
 * Progress → Coming days and the coming days in Training → Programs.
 * This page only loads and composes; the month is core/training/calendar.ts.
 */
import { CalendarDays, CalendarRange } from "lucide-react";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, todayIn } from "@/core/shared/dates";
import { formatNumber } from "@/core/shared/format";
import { weekOutlook } from "@/core/energy/repositories/outlook";
import {
  isMonth,
  lookOf,
  monthGrid,
  shiftMonth,
  type Look,
} from "@/core/training/calendar";
import { isRest } from "@/core/training/program";
import { listExercises } from "@/core/training/repositories/exercises";
import {
  getActivePlan,
  programOverrideDays,
} from "@/core/training/repositories/programs";
import { listRoutines } from "@/core/training/repositories/routines";
import { listSessions } from "@/core/training/repositories/sessions";
import {
  MonthCalendar,
  type PlanDayView,
  type PlanEntry,
} from "@/features/training/plan/MonthCalendar";
import { ProgramDays } from "@/features/training/programs/ProgramDays";
import { PlanDaySheet, type PlanDayInfo } from "@/features/training/plan/PlanDaySheet";
import { startOrPlanAction } from "../training/live-actions";
import { fill } from "@/i18n";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { setProgramDayAction, swapProgramDaysAction } from "../training/programs/actions";

const INTL = { it: "it-IT", en: "en-GB" } as const;
const NONE: Look = { region: null, pattern: null, cardio: false };

type Props = { searchParams: Promise<{ month?: string }> };

export default async function PlanPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const p = t.plan;
  const db = getDb();
  const today = todayIn(settings.timezone);
  const asked = (await searchParams).month;
  const month = asked && isMonth(asked) ? asked : today.slice(0, 7);
  const weeks = monthGrid(month);
  const from = weeks[0]![0]!;
  const to = weeks.at(-1)![6]!;
  const ahead = Math.max(
    7,
    Math.round((Date.parse(to) - Date.parse(today)) / 86_400_000) + 1,
  );
  const [sessions, routines, exercises, active, outlook] = await Promise.all([
    listSessions(db, owner, from, to),
    listRoutines(db, owner),
    listExercises(db, owner),
    getActivePlan(db, owner, today, ahead),
    // The coming week's day type and targets (was Progress → Coming days).
    weekOutlook(db, owner, today),
  ]);
  const n = (v: number) => formatNumber(String(v), settings.locale, 0);
  const notes = new Map(
    outlook.map((o) => [
      o.day,
      [o.dayType, o.targets && `${n(o.targets.kcal)} kcal · P ${n(o.targets.protein)}`]
        .filter(Boolean)
        .join(" · "),
    ]),
  );
  const changed = active
    ? await programOverrideDays(db, owner, active.program.id, today)
    : new Set<string>();

  // What each routine and exercise looks like (colour, icon), derived.
  const routineLook = new Map(
    routines.map((r) => [r.id, lookOf(r.items.map((it) => ({ ...it, sets: it.sets })))]),
  );
  const exerciseLook = new Map(exercises.map((e) => [e.id, lookOf([{ ...e, sets: 1 }])]));

  const byDay = new Map<string, PlanEntry[]>();
  const add = (day: string, e: PlanEntry) =>
    byDay.set(day, [...(byDay.get(day) ?? []), e]);
  for (const s of sessions) {
    const look = s.exercises.length
      ? lookOf(
          s.exercises.map((e) => ({
            ...e,
            sets: Math.max(1, e.sets.filter((x) => !x.warmup).length),
          })),
        )
      : (s.routineId && routineLook.get(s.routineId)) || NONE;
    add(s.day, {
      key: s.id,
      name: s.label,
      look,
      state: s.status === "done" ? "done" : "planned",
    });
  }
  // From today on, the program's days: each item (ADR-0035), unless a
  // session of the day already stands for it; a rest; or skipped.
  for (const d of active?.plan ?? []) {
    if (d.day > to) break;
    const slot = d.slot;
    const view = active!.program.slots.find((x) => x.position === slot.position);
    if (isRest(slot)) {
      if ((byDay.get(d.day)?.length ?? 0) > 0) continue;
      add(d.day, {
        key: `program-${d.day}`,
        name: slot.label || p.rest,
        look: NONE,
        state: "rest",
        changed: changed.has(d.day),
      });
      continue;
    }
    for (const [i, it] of (view?.items ?? []).entries()) {
      const covered = sessions.some(
        (s) =>
          s.day === d.day &&
          (it.routineId
            ? s.routineId === it.routineId
            : s.exercises.some((e) => e.exerciseId === it.exerciseId)),
      );
      if (covered) continue;
      add(d.day, {
        key: `program-${d.day}-${i}`,
        name: it.name,
        look: it.routineId
          ? (routineLook.get(it.routineId) ?? NONE)
          : (exerciseLook.get(it.exerciseId!) ?? NONE),
        state: d.skipped ? "skipped" : "program",
        late: d.late,
        changed: changed.has(d.day) && !d.skipped,
      });
    }
  }

  const intl = INTL[settings.locale];
  const dayLabel = new Intl.DateTimeFormat(intl, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const views: PlanDayView[][] = weeks.map((w) =>
    w.map((day) => ({
      day,
      label: dayLabel.format(new Date(`${day}T12:00:00Z`)),
      inMonth: day.startsWith(month),
      isToday: day === today,
      entries: byDay.get(day) ?? [],
      note: notes.get(day) || undefined,
    })),
  );
  // The day sheet (ADR-0035): what each day of the grid allows.
  const planOn = new Map((active?.plan ?? []).map((d) => [d.day, d]));
  const sheetDays: Record<string, PlanDayInfo> = Object.fromEntries(
    views.flat().map((v) => {
      const pd = planOn.get(v.day);
      return [
        v.day,
        {
          label: v.label,
          entries: v.entries.map(({ key, name, look, state }) => ({
            key,
            name,
            look,
            state,
          })),
          editable: Boolean(active && pd && v.day >= today),
          training: Boolean(pd && !isRest(pd.slot) && !pd.skipped),
          changed: changed.has(v.day),
          coming: v.day >= today,
        },
      ];
    }),
  );
  const weekdays = weeks[0]!.map((day) =>
    new Intl.DateTimeFormat(intl, { weekday: "narrow", timeZone: "UTC" }).format(
      new Date(`${day}T12:00:00Z`),
    ),
  );
  const title = new Intl.DateTimeFormat(intl, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
  const short = new Intl.DateTimeFormat(intl, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <>
      <PageHeader title={p.title} />
      <Section title={p.calendar} icon={<CalendarDays size={20} aria-hidden="true" />}>
        <MonthCalendar
          title={title}
          prevHref={`/plan?month=${shiftMonth(month, -1)}`}
          nextHref={`/plan?month=${shiftMonth(month, 1)}`}
          todayHref={month === today.slice(0, 7) ? null : "/plan"}
          weekdays={weekdays}
          weeks={views}
          // This month: the agenda starts today (the past is in the grid
          // and in Progress); other months: all their days.
          agendaFrom={month === today.slice(0, 7) ? today : null}
          t={p}
        />
      </Section>
      <PlanDaySheet
        days={sheetDays}
        slots={(active?.program.slots ?? [])
          .filter((x) => !isRest(x))
          .map((x) => ({ position: x.position, name: x.name }))}
        routines={routines.map((r) => ({
          id: r.id,
          name: r.name,
          look: routineLook.get(r.id) ?? NONE,
        }))}
        setDay={setProgramDayAction}
        startOrPlan={startOrPlanAction}
        t={p}
      />
      {/* The coming days, changeable one at a time (moved from Programs). */}
      <Section
        title={active ? fill(p.coming, { name: active.program.name }) : p.title}
        icon={<CalendarRange size={20} aria-hidden="true" />}
      >
        {active ? (
          <>
            <p className="text-meta text-muted">{t.programs.changeHint}</p>
            <ProgramDays
              days={active.plan
                .filter((d) => d.day <= addDays(today, 6))
                .map((d) => ({
                  day: d.day,
                  date: short.format(new Date(`${d.day}T12:00:00Z`)),
                  name: isRest(d.slot)
                    ? d.slot.label || t.programs.rest
                    : (active.program.slots.find((s) => s.position === d.slot.position)
                        ?.name ?? ""),
                  position: isRest(d.slot) ? null : d.slot.position,
                  late: d.late,
                  changed: changed.has(d.day),
                }))}
              slots={active.program.slots
                .filter((s) => !isRest(s))
                .map((s) => ({ position: s.position, name: s.name }))}
              setDay={setProgramDayAction}
              swap={swapProgramDaysAction}
              t={t}
            />
          </>
        ) : (
          <p className="text-muted">{p.noProgram}</p>
        )}
      </Section>
    </>
  );
}
