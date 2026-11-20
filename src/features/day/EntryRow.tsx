"use client";
/**
 * One entry on the day (V-01 rows): its Box, with «Fatto» and «Salta» when
 * it is planned and «Ripristina» when it was skipped; swiped left past a
 * third of its width, or Delete pressed on it, it goes to the trash. The
 * gesture locks to the axis it starts on, so the page still scrolls.
 * What happens next (the server, the toast's Undo) is the day's: this
 * component only says which.
 */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ActionRow,
  Box,
  EntryDetails,
  F,
  MealBox,
  type BoxAct,
  type BoxEntry,
  type NutrientsData,
  type PlanAction,
} from "@lifeos/kit";
import { MEAL_WORDS, mealSlots } from "@/features/box/meal";
import type { Details } from "./details";
import type { Status } from "./filter";
import { stepServings } from "./servings";

export type RowIntent = "done" | "skipped" | "planned" | "remove";

const REMOVE_AT = 0.35;
const LOCK_PX = 10;

export function EntryRow({
  entry,
  status,
  density = "card",
  rail = true,
  mode = "compact",
  onRail,
  onIntent,
  onServings,
}: {
  /** `l0`: a meal's thin macro bars (the boards' L0); `details`: what the open box shows. */
  entry: BoxEntry & {
    l0?: NutrientsData | null;
    details?: Details | null;
    /** A session in progress: «Riprendi» instead of «Fatto» and «Salta». */
    running?: boolean;
    /** A session: begun in gym mode («Inizia»), never ticked done with no set. */
    session?: boolean;
    /** A meal or intake: its multiplier ("1" when none); −/+ when open. */
    servings?: string | null;
  };
  status: Status;
  density?: "card" | "row";
  rail?: boolean;
  mode?: "compact" | "times";
  onRail?: () => void;
  onIntent: (intent: RowIntent) => void;
  /** −/+ on the servings: the new value, saved by the day. */
  onServings?: (servings: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // Shown at once, the server's value when it comes back (optimistic, UI-59).
  const [served, setServed] = useState(entry.servings ?? null);
  useEffect(() => setServed(entry.servings ?? null), [entry.servings]);
  const serve = (dir: 1 | -1) => {
    if (served === null || !onServings) return;
    const next = stepServings(served, dir);
    if (next === served) return;
    setServed(next);
    onServings(next);
  };
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; y: number; axis: "h" | "v" | null } | null>(null);
  const width = useRef(1);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, axis: null };
    width.current = e.currentTarget.offsetWidth || 1;
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const mx = e.clientX - d.x;
    const my = e.clientY - d.y;
    if (d.axis === null) {
      if (Math.abs(mx) > LOCK_PX && Math.abs(mx) > Math.abs(my)) {
        d.axis = "h";
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (Math.abs(my) > LOCK_PX) d.axis = "v";
    }
    if (d.axis === "h") setDx(Math.min(0, mx));
  };
  const up = () => {
    const removing = drag.current?.axis === "h" && dx < -width.current * REMOVE_AT;
    drag.current = null;
    setDx(0);
    if (removing) onIntent("remove");
  };

  const acts: BoxAct[] =
    status === "planned" && entry.running && entry.href
      ? [
          {
            label: "Riprendi",
            aria: entry.title + ": riprendi in palestra",
            onClick: () => window.location.assign(entry.href!),
          },
        ]
      : status === "planned" && entry.session && entry.href
        ? [
            {
              label: "Inizia",
              aria: entry.title + ": inizia in palestra",
              onClick: () => window.location.assign(entry.href!),
            },
            {
              label: "Salta",
              aria: entry.title + ": salta",
              onClick: () => onIntent("skipped"),
            },
          ]
        : status === "planned"
          ? [
              {
                label: "Fatto",
                aria: entry.title + ": segna fatto",
                onClick: () => onIntent("done"),
              },
              {
                label: "Salta",
                aria: entry.title + ": salta",
                onClick: () => onIntent("skipped"),
              },
            ]
          : status === "skipped"
            ? [
                {
                  label: "Ripristina",
                  aria: entry.title + ": rimetti tra i previsti",
                  onClick: () => onIntent("planned"),
                },
              ]
            : [];

  // Opened, the meal's actions row (PAT-101, ACT-03, ACT-49): the porzioni once, as a stepper,
  // and the trash at its end; deleting is also a swipe to the left (FOOD-47).
  const stepping = served !== null && !!onServings;
  const actions: PlanAction[] = [
    ...(stepping
      ? [
          {
            key: "servings",
            label: "Porzioni",
            step: {
              value: "×\u00a0" + F.input(Number(served), 2),
              minus: "Meno porzioni di " + entry.title,
              plus: "Più porzioni di " + entry.title,
            },
            onMinus: () => serve(-1),
            onPlus: () => serve(1),
          },
        ]
      : []),
    {
      key: "delete",
      label: "Elimina",
      aria: "Elimina " + entry.title,
      danger: "delete" as const,
      onClick: () => onIntent("remove"),
    },
  ];
  // The «× n» pill says what the stepper already says: once only (his §135).
  const shown =
    stepping && entry.pills
      ? { ...entry, pills: entry.pills.filter((p) => !p.t.startsWith("×\u00a0")) }
      : entry;

  return (
    <div
      className={"k-swipe" + (dx !== 0 ? " moving" : "")}
      tabIndex={0}
      aria-label={entry.title + ": Canc per eliminare"}
      aria-keyshortcuts="Delete"
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Delete" || e.key === "Backspace"))
          onIntent("remove");
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <span className="under" aria-hidden="true">
        Elimina
      </span>
      <div className="over" style={{ transform: dx ? `translateX(${dx}px)` : undefined }}>
        {entry.l0 ? (
          // A meal: the one box of every place (PAT-30); the day adds its porzioni and «Elimina».
          <MealBox
            entry={shown}
            data={entry.l0}
            slots={mealSlots({ details: entry.details ?? null, stepper: true })}
            words={MEAL_WORDS}
            density={density}
            rail={rail}
            mode={mode}
            {...(onRail ? { onRail } : {})}
            acts={acts}
            actions={actions}
          />
        ) : (
          <Box
            entry={shown}
            density={density}
            rail={rail}
            mode={mode}
            {...(onRail ? { onRail } : {})}
            acts={acts}
            // Every box opens (the boards: «si apre come ogni riquadro») on its details.
            {...(entry.details
              ? { expanded: open, onToggle: () => setOpen((o) => !o), doors: [] }
              : {})}
          >
            {open && <ActionRow actions={actions} />}
            {open && entry.details && <EntryDetails d={entry.details} />}
          </Box>
        )}
      </div>
    </div>
  );
}
