"use client";
/**
 * DateNav, day mode (kit.md §3, flows.md §2): ‹ › a day, the title opens the
 * month, the week strip under it, "Oggi" when away. Links, not state: every
 * day is its own page (`hrefBase` + ISO date). The week and the month are
 * computed from the date. Scores (0–100) colour the bars when given; a tag
 * (the cycle's step, the day's model) names a day under its number.
 * Week mode (Piano, the board Plan): «Settimana 42 · 12–18 ottobre», ‹ ›
 * move a week (`weekBase` + a day of it), the strip's days still open a day.
 */
import { useState } from "react";
import { addDays, monthOf, weekOf } from "./calendar";
import { F } from "./format";

export function DateNav({
  day,
  today,
  hrefBase,
  scores = {},
  tags = {},
  mode = "day",
  weekBase,
}: {
  day: string;
  mode?: "day" | "week";
  /** Week mode: the prefix of a week's page ("/piano?settimana="). */
  weekBase?: string;
  today: string;
  /** Prefix of a day's page: "/oggi/" → "/oggi/2026-10-15". */
  hrefBase: string;
  scores?: Record<string, number>;
  tags?: Record<string, string>;
}) {
  const [month, setMonth] = useState(false);
  const href = (d: string) => hrefBase + d;
  const bar = (d: string) => F.judge(scores[d]).tone;
  const week = mode === "week";
  const days = weekOf(day);
  const first = days[0]!;
  const last = days[6]!;
  const title = week ? "Settimana " + F.week(day).replace(/^sett\.\s/, "") : F.Day(day);
  const sub = week
    ? first.slice(5, 7) === last.slice(5, 7)
      ? Number(first.slice(8)) + "–" + Number(last.slice(8)) + " " + F.month(first)
      : F.date(first) + " – " + F.date(last)
    : F.month(day) + " · " + F.week(day);
  const step = (n: number) =>
    week && weekBase ? weekBase + addDays(day, n * 7) : href(addDays(day, n));
  const away = week ? !days.includes(today) : day !== today;
  const m = monthOf(day);
  return (
    <div className="k-dn">
      <div className="top">
        <a
          className="nav"
          href={step(-1)}
          aria-label={week ? "Settimana prima" : "Giorno prima"}
        >
          ‹
        </a>
        <button
          type="button"
          className="ttl"
          onClick={() => setMonth(!month)}
          aria-expanded={month}
          aria-label={
            title + ". Tocca per " + (month ? "chiudere" : "aprire") + " il mese"
          }
        >
          {title} <small>{sub}</small>
        </button>
        <a
          className="nav"
          href={step(1)}
          aria-label={week ? "Settimana dopo" : "Giorno dopo"}
        >
          ›
        </a>
        {away && (
          <a
            href={week && weekBase ? weekBase + today : href(today)}
            className="k-btn secondary"
          >
            Oggi
          </a>
        )}
      </div>
      <nav className="k-week" aria-label="La settimana">
        {days.map((d) => {
          const current = d === day;
          return (
            <a
              key={d}
              href={href(d)}
              aria-current={current ? "date" : undefined}
              aria-label={
                F.day(d) +
                (tags[d] ? ", " + tags[d] : "") +
                (scores[d] !== undefined ? ", voto " + scores[d] : "")
              }
              style={{
                color: current
                  ? "var(--sheet)"
                  : scores[d] === undefined
                    ? "var(--muted)"
                    : "var(--ink)",
              }}
            >
              <span className="k-help k-inh">{F.letter(d)}</span>
              <span className="k-num d3 k-inh">{Number(d.slice(8))}</span>
              {tags[d] && <span className="tag">{tags[d]}</span>}
              <span
                className="sc"
                style={{ background: current ? "var(--sheet)" : bar(d) }}
              />
            </a>
          );
        })}
      </nav>
      <div className={"k-reveal" + (month ? " on" : "")}>
        <div>
          <div className="k-month" role="grid" aria-label="Il mese">
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
                href={href(d)}
                className={
                  "c" + (d === today ? " today" : "") + (d > today ? " future" : "")
                }
                aria-label={
                  F.day(d) +
                  (tags[d] ? ", " + tags[d] : "") +
                  (scores[d] !== undefined ? ", voto " + scores[d] : "")
                }
              >
                <span>{Number(d.slice(8))}</span>
                <span
                  className="dot"
                  style={{ background: d === today ? "transparent" : bar(d) }}
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
