"use client";
/**
 * Recurrence (PAT-61 «Ogni quanto», PL-20; Q-15 (a)): one choice of how often, then its own
 * second control («Nel ciclo», Q-18 (a), has none: it says when it is planned) — weekday chips (checkboxes: a tap on iOS does not move the focus, so the
 * in-place editor stays open), a stepper, native date pickers. Posts the value as JSON text
 * under `name` (`recurrence.ts`); its sub-controls post under `name.*`, which forms ignore.
 * Controlled: `Field` holds the text.
 */
import { F } from "./format";
import { Glyph } from "./Glyph";
import {
  RECURRENCE_KINDS,
  readRecurrence,
  recurrenceText,
  startOf,
  type Recurrence as Value,
  type RecurrenceKind,
} from "./recurrence";
import { Stepper } from "./Stepper";
import { WORDS } from "./words";

const localToday = () => new Date().toLocaleDateString("sv");

export function Recurrence({
  id,
  name,
  label,
  value,
  onChange,
  today,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  today?: string | undefined;
}) {
  const w = WORDS.recurrence;
  const r = readRecurrence(value);
  const set = (x: Value) => onChange(JSON.stringify(x));
  const int = (s: string, lo: number, hi: number) => {
    const n = Number(s.replace(",", "."));
    return Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : null;
  };
  return (
    <div className="k-stack g2">
      <input type="hidden" name={name} value={r ? JSON.stringify(r) : ""} />
      <select
        id={id}
        className="k-select"
        value={r?.type ?? ""}
        onChange={(e) => {
          const k = e.target.value as RecurrenceKind | "";
          if (k === "") onChange("");
          else set(startOf(k, r ?? { type: "daily" }, today ?? localToday()));
        }}
      >
        <option value="">–</option>
        {RECURRENCE_KINDS.map((k) => (
          <option key={k} value={k}>
            {w.kinds[k]}
          </option>
        ))}
      </select>
      {r?.type === "weekdays" && (
        <div className="k-chips days" role="group" aria-label={label}>
          {w.days.map((d, i) => (
            <label key={d} className="k-chip">
              <input
                type="checkbox"
                name={name + ".day"}
                value={i + 1}
                checked={r.days.includes(i + 1)}
                aria-label={w.daysLong[i]}
                onChange={(e) => {
                  const days = e.target.checked
                    ? [...r.days, i + 1]
                    : r.days.filter((x) => x !== i + 1);
                  // At least one day: unticking the last one keeps it.
                  if (days.length > 0) set({ type: "weekdays", days: days.sort() });
                }}
              />
              {d}
            </label>
          ))}
        </div>
      )}
      {r?.type === "everyN" && (
        <>
          <span className="k-label">{w.every}</span>
          <Stepper
            id={id + "-n"}
            name={name + ".n"}
            label={w.every}
            value={String(r.n)}
            onChange={(s) => {
              const n = int(s, 1, 366);
              if (n !== null) set({ ...r, n });
            }}
          />
          <label className="k-stack g1">
            <span className="k-label">{w.from}</span>
            <input
              type="date"
              className="k-text"
              name={name + ".start"}
              value={r.start}
              onChange={(e) => e.target.value && set({ ...r, start: e.target.value })}
            />
          </label>
        </>
      )}
      {r?.type === "timesPerWeek" && (
        <>
          <span className="k-label">{w.times}</span>
          <Stepper
            id={id + "-n"}
            name={name + ".n"}
            label={w.times}
            value={String(r.n)}
            onChange={(s) => {
              const n = int(s, 1, 7);
              if (n !== null) set({ ...r, n });
            }}
          />
        </>
      )}
      {r?.type === "onDates" && (
        <div className="k-stack g2">
          {r.dates.map((d, i) => (
            <div key={d} className="k-line">
              <input
                type="date"
                className="k-text k-grow"
                aria-label={w.date + " " + (i + 1)}
                name={name + ".date"}
                value={d}
                onChange={(e) =>
                  e.target.value &&
                  set({
                    type: "onDates",
                    dates: r.dates.map((x, j) => (j === i ? e.target.value : x)),
                  })
                }
              />
              {r.dates.length > 1 && (
                <button
                  type="button"
                  className="k-icon-btn"
                  aria-label={w.removeDate(F.date(d))}
                  onClick={() =>
                    set({ type: "onDates", dates: r.dates.filter((_, j) => j !== i) })
                  }
                >
                  <Glyph of={{ ui: "close" }} decorative />
                </button>
              )}
            </div>
          ))}
          <div>
            <button
              type="button"
              className="k-btn link"
              onClick={() => {
                const last = r.dates[r.dates.length - 1] ?? today ?? localToday();
                const next = new Date(Date.parse(last + "T00:00:00Z") + 864e5)
                  .toISOString()
                  .slice(0, 10);
                set({ type: "onDates", dates: [...r.dates, next] });
              }}
            >
              {w.addDate}
            </button>
          </div>
        </div>
      )}
      {r && (
        <span className="k-meta">
          {r.type === "inCycle" ? w.inCycleHelp : recurrenceText(r)}
        </span>
      )}
    </div>
  );
}
