"use client";
/**
 * «Questa volta» on a ritmo (proposal §32, §36, §39): the day's step as the app's own Box
 * (VIS-40) — closed: its icon, the step, the line's time, one short action «Salta» (or
 * «Riprendi»); open: two doors, «Passo» (a drop-down, the list grows: VIS-85) and «Ora» («Sposta
 * questa volta», PL-43, with «↺» back to the ciclo's time). Each choice saves at once. His 15 Nov:
 * «fa ancora veramente schifo… tasti decentrati… scritte lunghe inutilmente».
 */
import { Box, Field } from "@lifeos/kit";
import { useState, useTransition } from "react";

export function ThisTime({
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
  steps: { label: string; position: number | null; rest: boolean }[];
  /** The step the day has now (its position, null for a rest). */
  current: number | null;
  skipped: boolean;
  choose: (position: number | null | undefined) => Promise<void>;
  skip: (skipped: boolean) => Promise<void>;
  /** The line he came from (its tag), by name; null: no time to move. */
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
  const rest = current === null || !!now?.rest;
  return (
    <Box
      rail={false}
      entry={{
        fam: rest ? "day" : "train",
        ...(rest ? {} : { sub: "strength" }),
        title: now?.label ?? "—",
        ...(line && at ? { value: at } : {}),
        ...(line && line !== now?.label ? { meta: line } : {}),
        ...(skipped ? { faded: true, pills: [{ t: "saltato" }] } : { planned: true }),
      }}
      acts={[
        {
          label: skipped ? "Riprendi" : "Salta",
          aria: skipped ? "Non saltare più questa volta" : "Salta questa volta",
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
          label: "Passo",
          value: now?.label ?? "—",
          panel: (
            <Field
              name="passo"
              label="Passo"
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
                label: "Ora",
                value: at || "—",
                panel: (
                  <div className="k-line bottom g2" aria-busy={pending}>
                    <Field
                      name="ora"
                      label={line + " alle"}
                      hideLabel
                      type="time"
                      defaultValue={at}
                      onChange={(v) => {
                        if (/^\d{2}:\d{2}$/.test(v) && v !== at) start(() => move(v));
                      }}
                    />
                    {moved && (
                      <button
                        type="button"
                        className="k-btn link"
                        aria-label="Torna all'ora del ciclo"
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
