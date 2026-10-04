/**
 * features/training/plan/PlanDaySheet.tsx — tapping a day in the Plan
 * (ADR-0035) opens this sheet: what is on the day, then what can be done
 * with it — open it; for a coming day of the program, skip it (the cycle
 * moves on), rest, do another of its days instead, or go back to the
 * cycle; add a routine to the day (a planned session), or take a planned
 * session away again (trash, with Undo). One sheet for every day: the day
 * comes in the hash, `#plan-day:YYYY-MM-DD`.
 */
"use client";

import {
  CalendarDays,
  CalendarRange,
  Moon,
  Plus,
  RotateCcw,
  SkipForward,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";
import type { Look } from "@/core/training/calendar";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { toast } from "@/ui/Toast";
import { PlanChip, type PlanState } from "@/ui/PlanChip";

export const PLAN_DAY = "plan-day";

export type PlanDayInfo = {
  label: string;
  entries: {
    key: string;
    name: string;
    look: Look;
    state: PlanState;
    /** A planned session's id: it can be taken away. */
    sessionId?: string;
  }[];
  /** Today or later, with an active program: the program's day can change. */
  editable: boolean;
  /** The program puts training on it (so it can be skipped or rested). */
  training: boolean;
  /** Changed or skipped by hand: it can go back to the cycle. */
  changed: boolean;
  /** Today or later: a routine can be added. */
  coming: boolean;
};

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function PlanDaySheet({
  days,
  slots,
  routines,
  setDay,
  startOrPlan,
  remove,
  restore,
  t,
}: {
  days: Record<string, PlanDayInfo>;
  /** The active program's training days, for "do instead". */
  slots: { position: number; name: string }[];
  routines: { id: string; name: string; look: Look }[];
  setDay: (day: string, value: string) => Promise<{ ok: boolean; message?: string }>;
  startOrPlan: (formData: FormData) => Promise<void>;
  remove: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
  t: Messages["plan"];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const day = hash.startsWith(`#${PLAN_DAY}:`) ? hash.slice(PLAN_DAY.length + 2) : null;
  const info = day ? days[day] : undefined;
  const done = () => {
    // Drop the hash and say so: the sheet closes (ui/Sheet listens).
    history.replaceState(null, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    router.refresh();
  };
  const change = (value: string) =>
    start(async () => {
      const r = await setDay(day!, value);
      if (!r.ok) toast({ message: r.message ?? "" });
      done();
    });
  const add = (routineId: string) =>
    start(async () => {
      const fd = new FormData();
      fd.set("routineId", routineId);
      fd.set("mode", "plan");
      fd.set("day", day!);
      fd.set("time", "");
      await startOrPlan(fd);
      toast({ message: t.added });
      done();
    });
  const drop = (id: string, name: string) =>
    start(async () => {
      const r = await remove(id);
      if (!r.ok) {
        toast({ message: r.message ?? "" });
        return;
      }
      toast({
        message: fill(t.removed, { name }),
        action: {
          label: t.undo,
          run: async () => {
            await restore(id);
            router.refresh();
          },
        },
      });
      router.refresh();
    });
  const btn = buttonClass({ variant: "subtle", size: "sm" });
  return (
    <Sheet
      id={PLAN_DAY}
      title={info?.label ?? ""}
      icon={<CalendarDays size={20} aria-hidden="true" />}
      closeLabel={t.close}
    >
      {info && day && (
        <div className="flex flex-col gap-4" aria-busy={pending}>
          {info.entries.length === 0 ? (
            <p className="text-muted">{t.nothingThatDay}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-meta">
              {info.entries.map((e) => (
                <li
                  key={e.key}
                  className="flex min-h-11 items-center justify-between gap-2"
                >
                  <PlanChip look={e.look} state={e.state} label={e.name} />
                  {e.sessionId && (
                    <button
                      type="button"
                      disabled={pending}
                      aria-label={fill(t.remove, { name: e.name })}
                      title={fill(t.remove, { name: e.name })}
                      onClick={() => drop(e.sessionId!, e.name)}
                      className={`${buttonClass({ variant: "subtle", iconOnly: true })} text-tomato`}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {info.entries.some((e) => e.state === "program") && (
            <p className="text-meta text-muted">{t.programItemHint}</p>
          )}
          <Link
            href={`/?day=${day}&tab=training`}
            className={`self-start ${buttonClass()}`}
          >
            <CalendarDays size={18} aria-hidden="true" />
            {t.openDay}
          </Link>

          {info.editable && (
            <section className="flex flex-col gap-2">
              <h3 className="inline-flex items-center gap-1.5 font-display text-item font-semibold">
                <CalendarRange size={18} aria-hidden="true" />
                {t.program}
              </h3>
              <div className="flex flex-wrap gap-2">
                {info.training && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => change("skip")}
                    className={btn}
                  >
                    <SkipForward size={16} aria-hidden="true" />
                    {t.skip}
                  </button>
                )}
                {info.training && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => change("rest")}
                    className={btn}
                  >
                    <Moon size={16} aria-hidden="true" />
                    {t.rest}
                  </button>
                )}
                {info.changed && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => change("cycle")}
                    className={btn}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    {t.backToCycle}
                  </button>
                )}
              </div>
              {info.training && <p className="text-meta text-muted">{t.skipHint}</p>}
              {slots.length > 0 && (
                <>
                  <span className="text-meta font-semibold">{t.instead}</span>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.position}
                        type="button"
                        disabled={pending}
                        onClick={() => change(String(s.position))}
                        className={buttonClass({ variant: "quiet", size: "sm" })}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {info.coming && routines.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="inline-flex items-center gap-1.5 font-display text-item font-semibold">
                <Plus size={18} aria-hidden="true" />
                {t.addRoutine}
              </h3>
              <div className="flex flex-wrap gap-2">
                {routines.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={pending}
                    onClick={() => add(r.id)}
                    className="rounded-badge disabled:opacity-50"
                  >
                    <PlanChip look={r.look} state="program" label={r.name} />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
}
