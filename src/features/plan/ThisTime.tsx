"use client";
/**
 * «Questa volta» on a ritmo (proposal §32, §36, §39): the day's step as the app's own Box
 * (VIS-40) — closed: its icon, the step, the line's time, one short action «Salta» (or
 * «Riprendi»); open: two doors, «Passo» (a drop-down, the list grows: VIS-85) and «Ora» («Sposta
 * questa volta», PL-43, with «↺» back to the ciclo's time). Each choice saves; a field follows
 * what was saved (keyed by its value: after «↺» it shows the ciclo's time again — the audit of
 * 15 Nov found it kept the old one). Its icon is the page's to give (VIS-30), its words
 * `i18n/plan` (PAT-81).
 */
import { Box, Field } from "@lifeos/kit";
import { useEffect, useRef, useState, useTransition } from "react";
import { plan } from "@/i18n/plan";

const w = plan.thisTime;
const CLOCK = /^\d{2}:\d{2}$/;
const PAUSE_MS = 700;

export function ThisTime({
  fam,
  steps,
  current,
  skipped,
  choose,
  skip,
  line,
  at,
  moved,
  move,
}: {
  /** The drawing's family, from the ciclo's type (a rest's: the day's). */
  fam: string;
  steps: { label: string; position: number | null }[];
  /** The step the day has now (its position, null for a rest). */
  current: number | null;
  skipped: boolean;
  choose: (position: number | null | undefined) => Promise<void>;
  skip: (skipped: boolean) => Promise<void>;
  /** The line he came from (its tag), by name, when it is of this day's step; else null. */
  line: string | null;
  /** That line's time that day («HH:MM»), "" when not known. */
  at: string;
  /** The line was moved this day: «↺» shows. */
  moved: boolean;
  /** «HH:MM» moves the line that day; "" gives it back its own time. */
  move: ((at: string) => Promise<void>) | null;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [door, setDoor] = useState<string | null>("passo");
  const key = (p: number | null) => (p === null ? "rest" : String(p));
  const now = steps.find((s) => s.position === current);
  // The time is saved after a short pause, not at every digit typed.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const later = (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!move || !CLOCK.test(v) || v === at) return;
    timer.current = setTimeout(() => start(() => move(v)), PAUSE_MS);
  };
  return (
    <Box
      rail={false}
      entry={{
        fam,
        title: now?.label ?? "—",
        ...(line && at ? { value: at } : {}),
        ...(line && line !== now?.label ? { meta: line } : {}),
        ...(skipped ? { faded: true, pills: [{ t: w.skipped }] } : { planned: true }),
      }}
      acts={[
        {
          label: skipped ? w.resume : w.skip,
          aria: skipped ? w.resumeAria : w.skipAria,
          onClick: () => start(() => skip(!skipped)),
        },
      ]}
      expanded={open}
      onToggle={() => setOpen(!open)}
      door={door}
      onDoor={(k) => setDoor(door === k ? null : k)}
      doors={[
        {
          key: "passo",
          label: w.step,
          value: now?.label ?? "—",
          panel: (
            <Field
              key={key(current)}
              name="passo"
              label={w.step}
              hideLabel
              type="choice"
              grows
              required
              defaultValue={key(current)}
              options={steps.map((s) => ({ value: key(s.position), label: s.label }))}
              onChange={(v) => {
                const s = steps.find((x) => key(x.position) === v);
                if (s) start(() => choose(s.position));
              }}
            />
          ),
        },
        ...(line !== null && move && !skipped
          ? [
              {
                key: "ora",
                label: w.time,
                value: at || "—",
                panel: (
                  <div className="k-line bottom g2" aria-busy={pending}>
                    <Field
                      key={at}
                      name="ora"
                      label={w.at(line)}
                      hideLabel
                      type="time"
                      defaultValue={at}
                      onChange={later}
                    />
                    {moved && (
                      <button
                        type="button"
                        className="k-btn link"
                        aria-label={w.back}
                        disabled={pending}
                        onClick={() => start(() => move(""))}
                      >
                        ↺
                      </button>
                    )}
                  </div>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
