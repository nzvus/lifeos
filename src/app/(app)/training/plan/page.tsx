/**
 * app/(app)/training/plan/page.tsx — URL /training/plan[?view=week|month&day=…],
 * Training's first view (ADR-0036): the calendar, a week or a month at a
 * time, swiped sideways — sessions done and planned, and from today on what
 * the active program puts on each day — then my programs, with the active
 * one's coming days changeable one at a time (ADR-0029).
 * This page only loads and composes; the panels are core/training/calendar.ts.
 */
import { CalendarDays, CalendarRange } from "lucide-react";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { weekOutlook } from "@/core/energy/repositories/outlook";
import { addDays, isValidDay, todayIn } from "@/core/shared/dates";
import { formatNumber } from "@/core/shared/format";
import {
  lookOf,
  planPanels,
  shiftMonth,
  type Look,
  type PlanView,
} from "@/core/training/calendar";
import { isRest } from "@/core/training/program";
import { listExercises } from "@/core/training/repositories/exercises";
import {
  getActivePlan,
  listPrograms,
  programOverrideDays,
} from "@/core/training/repositories/programs";
import { listRoutines } from "@/core/training/repositories/routines";
import { listSessions } from "@/core/training/repositories/sessions";
import { TrainingNav } from "@/features/training/nav/TrainingNav";
import {
  PlanCalendar,
  type PlanEntry,
  type PlanPanel,
} from "@/features/training/plan/PlanCalendar";
import { PlanDaySheet, type PlanDayInfo } from "@/features/training/plan/PlanDaySheet";
import { ProgramDays } from "@/features/training/programs/ProgramDays";
import { ProgramList } from "@/features/training/programs/ProgramList";
import { fill } from "@/i18n";
import { Collapsible } from "@/ui/Collapsible";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { deleteSessionAction, restoreSessionAction } from "../actions";
import { startOrPlanAction } from "../live-actions";
import {
  deleteProgramAction,
  restoreProgramAction,
  setProgramDayAction,
  swapProgramDaysAction,
} from "../programs/actions";

const INTL = { it: "it-IT", en: "en-GB" } as const;
const NONE: Look = { region: null, pattern: null, cardio: false };

type Props = { searchParams: Promise<{ view?: string; day?: string; month?: string }> };

export default async function PlanPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const p = t.plan;
  const db = getDb();
  const today = todayIn(settings.timezone);
  const query = await searchParams;
  const view: PlanView = query.view === "month" ? "month" : "week";
  // ?month= is how the old /plan linked a month.
  const asked = query.day ?? (query.month ? `${query.month}-01` : undefined);
  const anchor = asked && isValidDay(asked) ? asked : today;
  const { panels: grid, at } = planPanels(view, anchor);
  const from = grid[0]!.weeks[0]![0]!;
  const to = grid.at(-1)!.weeks.at(-1)![6]!;
  const ahead = Math.max(
    7,
    Math.round((Date.parse(to) - Date.parse(today)) / 86_400_000) + 1,
  );
  const [sessions, routines, exercises, active, outlook, programs] = await Promise.all([
    listSessions(db, owner, from, to),
    listRoutines(db, owner),
    listExercises(db, owner),
    getActivePlan(db, owner, today, ahead),
    // The coming week's day type and targets.
    weekOutlook(db, owner, today),
    listPrograms(db, owner),
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

  const byDay = new Map<string, (PlanEntry & { sessionId?: string })[]>();
  const add = (day: string, e: PlanEntry & { sessionId?: string }) =>
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
    const done = s.status === "done";
    add(s.day, {
      key: s.id,
      name: s.label,
      look,
      state: done ? "done" : "planned",
      // A planned session can be taken off its day (trash, with Undo).
      sessionId: done ? undefined : s.id,
    });
  }
  // From today on, the program's days: each item (ADR-0035), unless a
  // session of the day already stands for it; a rest; or skipped.
  for (const d of active?.plan ?? []) {
    if (d.day > to) break;
    const slot = d.slot;
    const slotView = active!.program.slots.find((x) => x.position === slot.position);
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
    for (const [i, it] of (slotView?.items ?? []).entries()) {
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
  const utc = (day: string) => new Date(`${day}T12:00:00Z`);
  const dayLabel = new Intl.DateTimeFormat(intl, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const monthTitle = new Intl.DateTimeFormat(intl, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const shortDay = new Intl.DateTimeFormat(intl, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const panels: PlanPanel[] = grid.map((g) => ({
    key: g.key,
    // A month's name, or a week's first and last day ("28 set – 4 ott").
    title:
      view === "month"
        ? monthTitle.format(utc(`${g.key}-01`))
        : `${shortDay.format(utc(g.weeks[0]![0]!))} – ${shortDay.format(utc(g.weeks[0]![6]!))}`,
    weeks: g.weeks.map((w) =>
      w.map((day) => ({
        day,
        label: dayLabel.format(utc(day)),
        inMonth: view === "week" || day.startsWith(g.key),
        isToday: day === today,
        entries: (byDay.get(day) ?? []).map(({ sessionId: _, ...e }) => e),
        note: notes.get(day) || undefined,
      })),
    ),
  }));
  const holds = (g: (typeof grid)[number], day: string) =>
    view === "month" ? g.key === day.slice(0, 7) : g.weeks[0]!.includes(day);
  const todayIndex = grid.findIndex((g) => holds(g, today));
  const href = (v: PlanView, day: string) => `/training/plan?view=${v}&day=${day}`;
  const step = (by: number) =>
    view === "month"
      ? `${shiftMonth(grid[at]!.key, by)}-01`
      : addDays(grid[at]!.key, 7 * by);

  // The day sheet (ADR-0035): what each day of the panels allows.
  const planOn = new Map((active?.plan ?? []).map((d) => [d.day, d]));
  const sheetDays: Record<string, PlanDayInfo> = {};
  for (const g of grid)
    for (const day of g.weeks.flat()) {
      const pd = planOn.get(day);
      sheetDays[day] = {
        label: dayLabel.format(utc(day)),
        entries: (byDay.get(day) ?? []).map(({ key, name, look, state, sessionId }) => ({
          key,
          name,
          look,
          state,
          sessionId,
        })),
        editable: Boolean(active && pd && day >= today),
        training: Boolean(pd && !isRest(pd.slot) && !pd.skipped),
        changed: changed.has(day),
        coming: day >= today,
      };
    }
  const weekdays = grid
    .find((g) => g.weeks.length)!
    .weeks[0]!.map((day) =>
      new Intl.DateTimeFormat(intl, { weekday: "narrow", timeZone: "UTC" }).format(
        utc(day),
      ),
    );
  const weekday = new Intl.DateTimeFormat(intl, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const looks = (it: { routineId: string | null; exerciseId: string | null }) =>
    (it.routineId
      ? routineLook.get(it.routineId)
      : exerciseLook.get(it.exerciseId ?? "")) ?? NONE;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t.training.title} quiet />
      <TrainingNav current="plan" t={t} />
      <Section title={p.calendar} icon={<CalendarDays size={20} aria-hidden="true" />}>
        <PlanCalendar
          // A new view or day starts on its own panel.
          key={`${view}-${anchor}`}
          view={view}
          viewHrefs={{ week: href("week", anchor), month: href("month", anchor) }}
          panels={panels}
          at={at}
          todayAt={todayIndex === -1 ? null : todayIndex}
          todayHref={`/training/plan?view=${view}`}
          earlierHref={href(view, step(-at - 1))}
          laterHref={href(view, step(grid.length - at))}
          weekdays={weekdays}
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
        remove={deleteSessionAction}
        restore={restoreSessionAction}
        t={p}
      />
      {/* My programs; the active one's coming days, changeable one at a time. */}
      <Section
        title={p.programs}
        icon={<CalendarRange size={20} aria-hidden="true" />}
        aside={String(programs.length)}
      >
        <p className="text-meta text-muted">{t.programs.subtitle}</p>
        {active ? (
          <Collapsible
            id="plan-coming"
            title={fill(p.coming, { name: active.program.name })}
            defaultOpen={false}
            inset
          >
            <p className="text-meta text-muted">{t.programs.changeHint}</p>
            <ProgramDays
              days={active.plan
                .filter((d) => d.day <= addDays(today, 6))
                .map((d) => ({
                  day: d.day,
                  date: weekday.format(utc(d.day)),
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
          </Collapsible>
        ) : (
          <p className="text-muted">{p.noProgram}</p>
        )}
        <ProgramList
          programs={programs.map((x) => ({
            id: x.id,
            name: x.name,
            active: x.active,
            since: fill(t.programs.since, { day: weekday.format(utc(x.startDay)) }),
            slots: x.slots.map((sl) => ({
              position: sl.position,
              label: sl.label,
              items: sl.items.map((it) => ({
                key: `${it.routineId ?? ""}${it.exerciseId ?? ""}`,
                name: it.name,
                look: looks(it),
              })),
            })),
          }))}
          trash={deleteProgramAction}
          restore={restoreProgramAction}
          t={t}
        />
      </Section>
    </div>
  );
}
