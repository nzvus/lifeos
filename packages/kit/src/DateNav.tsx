"use client";
/**
 * DateNav, day mode (kit.md §3, flows.md §2): ‹ › a day, the title opens the
 * month, the week strip under it, "Oggi" when away. Links, not state: every
 * day is its own page (`hrefBase` + ISO date). The week and the month are
 * computed from the date. Scores (0–100) colour the bars when given.
 */
import { useState } from "react";
import { addDays, monthOf, weekOf } from "./calendar";
import { F } from "./format";

export function DateNav({
  day,
  today,
  hrefBase,
  scores = {},
}: {
  day: string;
  today: string;
  /** Prefix of a day's page: "/oggi/" → "/oggi/2026-10-15". */
  hrefBase: string;
  scores?: Record<string, number>;
}) {
  const [month, setMonth] = useState(false);
  const href = (d: string) => hrefBase + d;
  const bar = (d: string) => F.judge(scores[d]).tone;
  const title = F.Day(day);
  const m = monthOf(day);
  return (
    <div className="k-dn">
      <div className="top">
        <a className="nav" href={href(addDays(day, -1))} aria-label="Giorno prima">
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
          {title} <small>{F.month(day) + " · " + F.week(day)}</small>
        </button>
        <a className="nav" href={href(addDays(day, 1))} aria-label="Giorno dopo">
          ›
        </a>
        {day !== today && (
          <a href={href(today)} className="k-btn secondary">
            Oggi
          </a>
        )}
      </div>
      <nav className="k-week" aria-label="La settimana">
        {weekOf(day).map((d) => {
          const current = d === day;
          return (
            <a
              key={d}
              href={href(d)}
              aria-current={current ? "date" : undefined}
              aria-label={
                F.day(d) + (scores[d] !== undefined ? ", voto " + scores[d] : "")
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
                  F.day(d) + (scores[d] !== undefined ? ", voto " + scores[d] : "")
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
