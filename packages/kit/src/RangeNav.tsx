/**
 * DateNav, range mode (kit.md §3; the boards' Andamento): a swipe on the
 * period goes to the one before or after (no ‹ ›, ledger UI-76), «↩ fino a
 * oggi» when the period does not end today, its dates as the title, the presets (7 · 30 · 90 giorni
 * · Mese) and the month of its last day with the period highlighted; a day
 * opens its page. Links, not state: every period is its own page, so a
 * server page renders it. Scores (0–100) colour the dots when given.
 */
import { monthOf } from "./calendar";
import { F } from "./format";
import { Swipe } from "./Swipe";

export type RangePreset = { label: string; href: string; on: boolean };

export function RangeNav({
  from,
  to,
  today,
  prevHref,
  nextHref,
  todayHref,
  presets,
  dayHref,
  scores = {},
}: {
  from: string;
  to: string;
  today: string;
  prevHref: string;
  /** Null when the period ends today. */
  nextHref: string | null;
  /** The same period ending today, for «↩ fino a oggi». */
  todayHref: string;
  presets: RangePreset[];
  /** A day's page from its ISO date. */
  dayHref: (day: string) => string;
  scores?: Record<string, number>;
}) {
  const m = monthOf(to);
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
  return (
    <div className="k-dn">
      <div className="top lv">
        <span className="ttl">
          {F.date(from)} – {F.date(to)}{" "}
          <small>{F.plural(days, "giorno", "giorni")}</small>
        </span>
        {nextHref && to < today && (
          <a className="back" href={todayHref}>
            ↩ fino a oggi
          </a>
        )}
      </div>
      <nav className="k-choice" aria-label="Periodo">
        {presets.map((p) => (
          <a key={p.label} href={p.href} aria-current={p.on ? "true" : undefined}>
            {p.label}
          </a>
        ))}
      </nav>
      <Swipe
        prev={prevHref}
        next={nextHref}
        label="Il periodo: scorri per quello prima o dopo"
      >
        <div className="k-month" role="grid" aria-label={"Il mese di " + F.month(to)}>
          {["L", "M", "M", "G", "V", "S", "D"].map((h, i) => (
            <span key={i} className="h">
              {h}
            </span>
          ))}
          {Array.from({ length: m.lead }, (_, i) => (
            <span key={"b" + i} className="c out" />
          ))}
          {m.days.map((d) => (
            <a
              key={d}
              href={dayHref(d)}
              className={
                "c" +
                (d === today ? " today" : "") +
                (d > today ? " future" : "") +
                (d >= from && d <= to ? " inrange" : "")
              }
              aria-label={
                F.day(d) +
                (d >= from && d <= to ? ", nel periodo" : "") +
                (scores[d] !== undefined ? ", voto " + scores[d] : "")
              }
            >
              <span>{Number(d.slice(8))}</span>
              <span
                className="dot"
                style={{
                  background: d === today ? "transparent" : F.judge(scores[d]).tone,
                }}
              />
            </a>
          ))}
        </div>
      </Swipe>
    </div>
  );
}
