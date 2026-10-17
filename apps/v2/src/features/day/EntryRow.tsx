"use client";
/**
 * One entry on the day (V-01 rows): its Box, with «Fatto» and «Salta» when
 * it is planned and «Ripristina» when it was skipped; swiped left past a
 * third of its width, or Delete pressed on it, it goes to the trash. The
 * gesture locks to the axis it starts on, so the page still scrolls.
 * What happens next (the server, the toast's Undo) is the day's: this
 * component only says which.
 */
import { useRef, useState, type PointerEvent } from "react";
import { Box, type BoxAct, type BoxEntry } from "@lifeos/kit";
import type { Status } from "./filter";

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
}: {
  entry: BoxEntry;
  status: Status;
  density?: "card" | "row";
  rail?: boolean;
  mode?: "compact" | "times";
  onRail?: () => void;
  onIntent: (intent: RowIntent) => void;
}) {
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
    status === "planned"
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
        <Box
          entry={entry}
          density={density}
          rail={rail}
          mode={mode}
          {...(onRail ? { onRail } : {})}
          acts={acts}
        />
      </div>
    </div>
  );
}
