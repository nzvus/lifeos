"use client";
/**
 * DateNav (kit.md §3, flows.md §2; ledger UI-76, decided 30 Oct): no ‹ › and no
 * button in the line — the strip swipes a week, the title opens the month,
 * «↩ oggi» is a word in the title's line only when away, today keeps a ring.
 * Levels like the weather (remembered with `levelKey`): 0 the days, 1 the thin
 * bars behind each number, 2 each day a column that grows into its 24 hours
 * (`rhythm`). Arrows stay only without `levelKey`. Links, not state: every
 * day is its own page (`hrefBase` + ISO date). The week and the month are
 * computed from the date. Scores (0–100) colour the bars when given; a tag
 * (the cycle's step, the day's model) names a day under its number.
 * Week mode (Piano, the board Plan): «Settimana 42 · 12–18 ottobre», ‹ ›
 * move a week (`weekBase` + a day of it), the strip's days still open a day.
 */
import { useRef, useState, type CSSProperties } from "react";
import { useLevel } from "./levels";

/**
 * A day's four thin bars (the developer's pick, 2026-10-25), in place of the
 * score's line: food against its targets, the worst limit as a share of its
 * allowance, training done or planned, habits done; each 0–1.
 */
/** A day's 24 hours, minutes of the clock day (0–1440): sleep, meals in their role's colour, sessions. */
export type Rhythm = {
  bands: { from: number; to: number }[];
  meals: { at: number; c: string }[];
  sessions: { from: number; to: number }[];
};

export type DayBars = {
  food?: number | null;
  limits?: number | null;
  train?: "done" | "planned" | null;
  habits?: number | null;
};
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
  bars,
  rhythm,
  nowMinute = null,
  levelKey,
}: {
  /** Each day's 24 hours: the strip's third level. */
  rhythm?: Record<string, Rhythm>;
  /** The minute now, on today's column. */
  nowMinute?: number | null;
  /** With it the strip has levels, kept under this key, and no arrows. */
  levelKey?: string;
  /** Each day's thin bars; when given they replace the score's line. */
  bars?: Record<string, DayBars>;
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
  const max = rhythm ? 2 : 1;
  const [stored, next] = useLevel(levelKey ?? "", max, 1);
  const level = levelKey ? stored : 1;
  const x0 = useRef<number | null>(null);
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
  const step = (n: number, byWeek = false) =>
    week && weekBase
      ? weekBase + addDays(day, n * 7)
      : href(addDays(day, byWeek ? n * 7 : n));
  const away = week ? !days.includes(today) : day !== today;
  const m = monthOf(day);
  return (
    <div className="k-dn">
      {levelKey ? (
        <div className="top lv">
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
          {away && (
            <a className="back" href={week && weekBase ? weekBase + today : href(today)}>
              {week ? "↩ questa settimana" : "↩ oggi"}
            </a>
          )}
          {(bars || rhythm) && (
            <button
              type="button"
              className="lvb"
              onClick={next}
              aria-label={
                "La settimana mostra " +
                LEVELS[level] +
                ": tocca per " +
                LEVELS[(level + 1) % (max + 1)]
              }
            >
              <span className="k-lv" aria-hidden="true">
                {Array.from({ length: max + 1 }, (_, i) => (
                  <i key={i} className={i <= level ? "on" : ""} />
                ))}
              </span>
            </button>
          )}
        </div>
      ) : (
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
      )}
      <nav
        className={"k-week" + (levelKey ? " lv" + level : "")}
        aria-label={
          levelKey ? "La settimana: scorri per la settimana prima o dopo" : "La settimana"
        }
        {...(levelKey
          ? {
              onPointerDown: (ev: { clientX: number }) => {
                x0.current = ev.clientX;
              },
              onPointerUp: (ev: { clientX: number }) => {
                const dx = x0.current === null ? 0 : ev.clientX - x0.current;
                x0.current = null;
                if (Math.abs(dx) > 48) window.location.href = step(dx < 0 ? 1 : -1, true);
              },
            }
          : {})}
      >
        {days.map((d) => {
          const current = d === day;
          return (
            <a
              key={d}
              href={href(d)}
              aria-current={current ? "date" : undefined}
              className={levelKey && d === today ? "today" : undefined}
              draggable={levelKey ? false : undefined}
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
              {bars ? (
                level >= 1 && <DayBarsMark b={bars[d]} bg={!!levelKey} />
              ) : (
                <span
                  className="sc"
                  style={{ background: current ? "var(--sheet)" : bar(d) }}
                />
              )}
              {levelKey && level === 2 && rhythm && (
                <DayColumn r={rhythm[d]} now={d === today ? nowMinute : null} />
              )}
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

function DayBarsMark({ b, bg = false }: { b: DayBars | undefined; bg?: boolean }) {
  const h = (v: number | null | undefined) =>
    Math.round(Math.max(0.08, Math.min(1, v ?? 0)) * 100) + "%";
  const limitTone = (r: number) =>
    r > 1 ? "var(--heat-bad)" : r > 0.85 ? "var(--heat-fair)" : "var(--heat-good)";
  const one = (key: string, v: number | null | undefined, color: string, extra = "") =>
    v == null ? (
      <i key={key} className="none" />
    ) : (
      <i
        key={key}
        className={extra}
        style={{ height: h(v), background: color } as CSSProperties}
      />
    );
  return (
    <span className={"k-wbars" + (bg ? " bg" : "")} aria-hidden="true">
      {one("f", b?.food, F.judge(b?.food == null ? undefined : b.food * 100).tone)}
      {one("l", b?.limits, b?.limits == null ? "" : limitTone(b.limits))}
      {b?.train === "planned"
        ? one("t", 1, "var(--muscle-chest)", "plan")
        : one("t", b?.train === "done" ? 1 : null, "var(--muscle-chest)")}
      {one("h", b?.habits, "var(--moment-snack)")}
    </span>
  );
}

const LEVELS = ["i giorni", "i giorni e le barre", "le barre e le 24 ore"];

/** A day's 24 hours in its cell, from midnight at the top: sleep, meals, sessions, now. */
function DayColumn({ r, now }: { r: Rhythm | undefined; now: number | null }) {
  const y = (m: number) => Math.round((m / 1440) * 1000) / 10 + "%";
  return (
    <span className="k-day24" aria-hidden="true">
      {[360, 720, 1080].map((g) => (
        <span key={g} className="gd" style={{ top: y(g) }} />
      ))}
      {r?.bands.map((b, i) => (
        <span
          key={"s" + i}
          className="sl"
          style={{ top: y(b.from), height: y(b.to - b.from) }}
        />
      ))}
      {r?.sessions.map((b, i) => (
        <span
          key={"t" + i}
          className="tr"
          style={{ top: y(b.from), height: y(Math.max(12, b.to - b.from)) }}
        />
      ))}
      {r?.meals.map((m, i) => (
        <span
          key={"m" + i}
          className="ml"
          style={{ top: y(m.at), background: m.c } as CSSProperties}
        />
      ))}
      {now !== null && <span className="nw" style={{ top: y(now) }} />}
    </span>
  );
}
