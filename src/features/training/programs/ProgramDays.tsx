/**
 * features/training/programs/ProgramDays.tsx — the active program's coming
 * days, changeable (ADR-0029): ↑/↓ swap a day with the one before or
 * after; the select puts any slot or a rest on that day, or "as the cycle
 * says"; on a computer a day can be dragged onto another to swap them.
 * Changed days are marked. Every change is an override; the cycle
 * fills the rest (core/training/program.ts).
 */
"use client";

import { ArrowDown, ArrowUp, GripVertical, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fill, type Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { Menu } from "@/ui/Menu";
import { toast } from "@/ui/Toast";

export type ProgramDayRow = {
  day: string;
  /** "ven 2 ott", formatted by the page. */
  date: string;
  name: string;
  /** The slot's position, or null for a rest. */
  position: number | null;
  late: boolean;
  changed: boolean;
};

type Outcome = { ok: boolean; message?: string };

export function ProgramDays({
  days,
  slots,
  setDay,
  swap,
  t,
}: {
  days: ProgramDayRow[];
  slots: { position: number; name: string }[];
  setDay: (day: string, value: string) => Promise<Outcome>;
  swap: (a: string, b: string) => Promise<Outcome>;
  t: Pick<Messages, "programs" | "actions">;
}) {
  const p = t.programs;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dragged, setDragged] = useState<string | null>(null);
  const run = (f: () => Promise<Outcome>) =>
    start(async () => {
      const r = await f();
      if (!r.ok) toast({ message: r.message ?? "" });
      router.refresh();
    });
  const small =
    "tile inline-flex h-9 w-9 items-center justify-center rounded-control disabled:opacity-40";
  return (
    <ol
      className={`flex flex-col gap-2 ${pending ? "opacity-60" : ""}`}
      aria-busy={pending}
    >
      {days.map((d, i) => (
        <li
          key={d.day}
          draggable
          onDragStart={() => setDragged(d.day)}
          onDragOver={(e) => dragged && dragged !== d.day && e.preventDefault()}
          onDrop={() => {
            if (dragged && dragged !== d.day) run(() => swap(dragged, d.day));
            setDragged(null);
          }}
          onDragEnd={() => setDragged(null)}
          // Phone: the day and its name on one line, the controls under it
          // on the right (2026-10-02: they squeezed the name); one line on
          // wide cards.
          className={`tile flex flex-col gap-2 px-3 py-2 @lg:flex-row @lg:items-center @lg:gap-3 ${
            dragged === d.day ? "opacity-50" : ""
          }`}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <GripVertical
              size={16}
              aria-hidden="true"
              className="hidden text-muted @lg:block"
            />
            <span className="w-20 shrink-0 text-meta text-muted first-letter:uppercase">
              {d.date}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="font-display text-item font-semibold">{d.name}</span>
              {d.late && <Badge tone="planned">{p.late}</Badge>}
              {d.changed && <Badge>{p.changed}</Badge>}
            </span>
          </span>
          <span className="flex items-center justify-end gap-1">
            <button
              type="button"
              disabled={i === 0 || pending}
              onClick={() => run(() => swap(d.day, days[i - 1]!.day))}
              aria-label={fill(p.swapWith, { day: days[i - 1]?.date ?? "" })}
              title={fill(p.swapWith, { day: days[i - 1]?.date ?? "" })}
              className={small}
            >
              <ArrowUp size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={i === days.length - 1 || pending}
              onClick={() => run(() => swap(d.day, days[i + 1]!.day))}
              aria-label={fill(p.swapWith, { day: days[i + 1]?.date ?? "" })}
              title={fill(p.swapWith, { day: days[i + 1]?.date ?? "" })}
              className={small}
            >
              <ArrowDown size={16} aria-hidden="true" />
            </button>
            {/* The same centred dialog as every "⋯" (2026-10-02: the select
                was square and changed width from row to row). */}
            <Menu
              label={fill(p.dayChoice, { day: d.date })}
              closeLabel={t.actions.close}
              trigger={{ icon: <Repeat size={16} aria-hidden="true" />, text: p.change }}
              items={[
                ...slots.map((s) => ({
                  label: s.name,
                  onSelect: () => run(() => setDay(d.day, String(s.position))),
                })),
                { label: p.rest, onSelect: () => run(() => setDay(d.day, "rest")) },
                ...(d.changed
                  ? [
                      {
                        label: p.asCycle,
                        onSelect: () => run(() => setDay(d.day, "cycle")),
                      },
                    ]
                  : []),
              ]}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}
