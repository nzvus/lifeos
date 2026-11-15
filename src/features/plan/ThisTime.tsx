"use client";
/**
 * «Questa volta» on a ritmo (proposal §32, §36, §37; his 15 Nov «toccando quel tag… puoi
 * visualizzare e configurare»): two values edited in place (PAT-13) — the day's step, a
 * drop-down because he extends the list of steps (VIS-85, his «tendine per scelte che si possono
 * espandere»), and the line's time («Sposta questa volta», PL-43) — then «Salta questa volta»
 * or its undo, and «↺ Ora del ciclo» once the line was moved. The page's server actions come
 * bound with the day and the ciclo; it re-reads after each.
 */
import { InPlace } from "@lifeos/kit";
import { useTransition } from "react";

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
  steps: { label: string; position: number | null }[];
  /** The step the day has now (its position, null for a rest). */
  current: number | null;
  skipped: boolean;
  choose: (position: number | null | undefined) => Promise<void>;
  skip: (skipped: boolean) => Promise<void>;
  /** The line he came from (its tag), by name; null: no time to move. */
  line: string | null;
  /** That line's time that day («HH:MM»), "" when not known. */
  at: string;
  /** The line was moved this day: «↺ Ora del ciclo» shows. */
  moved: boolean;
  /** «HH:MM» moves the line that day; "" gives it back its own time. */
  move: ((at: string) => Promise<void>) | null;
}) {
  const [pending, start] = useTransition();
  const key = (p: number | null) => (p === null ? "rest" : String(p));
  const now = steps.find((s) => s.position === current);
  return (
    <div className="k-stack g2" aria-busy={pending}>
      <InPlace
        spec={{
          key: "passo",
          label: "Passo",
          type: "choice",
          grows: true,
          required: true,
          choices: steps.map((s) => ({ value: key(s.position), label: s.label })),
        }}
        value={key(current)}
        shown={now?.label ?? "—"}
        onSave={async (v) => {
          const s = steps.find((x) => key(x.position) === v);
          if (s) await choose(s.position);
          return null;
        }}
      />
      {!skipped && line !== null && move && (
        <InPlace
          spec={{ key: "ora", label: line + " alle", type: "time" }}
          value={at}
          shown={at || "—"}
          onSave={async (v) => {
            if (typeof v === "string" && v !== "") await move(v);
            return null;
          }}
        />
      )}
      <div className="k-line wrap g2">
        <button
          type="button"
          className="k-btn secondary"
          disabled={pending}
          onClick={() => start(() => skip(!skipped))}
        >
          {skipped ? "Non saltare più" : "Salta questa volta"}
        </button>
        {moved && move && (
          <button
            type="button"
            className="k-btn link"
            disabled={pending}
            onClick={() => start(() => move(""))}
          >
            ↺ Ora del ciclo
          </button>
        )}
      </div>
    </div>
  );
}
