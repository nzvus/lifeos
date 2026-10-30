"use client";
/**
 * Visual study, round 2 of «la settimana» (ledger UI-76, KEEP-01). The
 * developer, 30 Oct: today's v2 strip is the best, but «le frecce di
 * navigazione rompono tutto» and «vai a oggi» breaks it further; option 1
 * (the 24-hour rhythm) the most beautiful, «ma non si può mettere così
 * grosso in oggi». So: v2's strip, no ‹ › and no button in the line — the
 * strip swipes a week, the title opens the month, «↩ oggi» is a word in the
 * title's line only when away, today keeps a ring in the strip; the strip has
 * levels like the weather (UI-80): 0 the days, 1 the thin bars, 2 the bars
 * and the rhythm of each day's 24 hours under its own column.
 */
import { useRef, useState, type CSSProperties } from "react";
import { F, addDays, monthOf, useLevel, weekOf, type DayBars } from "@lifeos/kit";

export type Rhythm = {
  bands: { from: number; to: number }[];
  meals: { at: number; c: string }[];
  sessions: { from: number; to: number }[];
};

export function DayHead({
  day,
  today,
  hrefBase,
  bars,
  tags = {},
  rhythm,
  nowMinute = null,
  levelKey,
  fallback = 1,
  variant = "a",
}: {
  day: string;
  today: string;
  hrefBase: string;
  bars: Record<string, DayBars>;
  tags?: Record<string, string>;
  rhythm: Record<string, Rhythm>;
  nowMinute?: number | null;
  levelKey: string;
  /** The level before the person picks one (the study shows level 2 too). */
  fallback?: number;
  /** a: each day one column that grows into its 24 hours; b: the bars behind the number. */
  variant?: "a" | "b";
}) {
  const [level, next] = useLevel(levelKey, 2, fallback);
  const [month, setMonth] = useState(false);
  const x0 = useRef<number | null>(null);
  const href = (d: string) => hrefBase + d;
  const days = weekOf(day);
  const away = day !== today;
  const m = monthOf(day);
  const H = 96;
  const y = (min: number) => (min / 1440) * H;
  const day24 = (d: string) => {
    const r = rhythm[d];
    return (
      <>
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
            style={{ top: y(b.from), height: Math.max(3, y(b.to - b.from)) }}
          />
        ))}
        {r?.meals.map((ml, i) => (
          <span
            key={"m" + i}
            className="ml"
            style={{ top: y(ml.at), background: ml.c } as CSSProperties}
          />
        ))}
        {d === today && nowMinute !== null && (
          <span className="nw" style={{ top: y(nowMinute) }} />
        )}
      </>
    );
  };
  const words = ["i giorni", "i giorni e le barre", "le barre e le 24 ore"];
  return (
    <div className={"k-dn st-dh v-" + variant}>
      <div className="top">
        <button
          type="button"
          className="ttl"
          onClick={() => setMonth(!month)}
          aria-expanded={month}
          aria-label={
            F.Day(day) + ". Tocca per " + (month ? "chiudere" : "aprire") + " il mese"
          }
        >
          {F.Day(day)} <small>{F.month(day) + " · " + F.week(day)}</small>
        </button>
        {away && (
          <a className="back" href={href(today)}>
            ↩ oggi
          </a>
        )}
        <button
          type="button"
          className="lv"
          onClick={next}
          aria-label={
            "La settimana mostra " +
            words[level] +
            ": tocca per " +
            words[(level + 1) % 3]
          }
        >
          <span className="k-lv" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <i key={i} className={i <= level ? "on" : ""} />
            ))}
          </span>
        </button>
      </div>
      <nav
        className="k-week"
        aria-label="La settimana: scorri per la settimana prima o dopo"
        onPointerDown={(e) => {
          x0.current = e.clientX;
        }}
        onPointerUp={(e) => {
          const dx = x0.current === null ? 0 : e.clientX - x0.current;
          x0.current = null;
          if (Math.abs(dx) > 48)
            window.location.href = href(addDays(day, dx < 0 ? 7 : -7));
        }}
      >
        {days.map((d) => (
          <a
            key={d}
            href={href(d)}
            className={d === today ? "today" : undefined}
            style={d > today && d !== day ? { color: "var(--muted)" } : undefined}
            aria-current={d === day ? "date" : undefined}
            aria-label={
              F.day(d) + (tags[d] ? ", " + tags[d] : "") + (d === today ? ", oggi" : "")
            }
          >
            <span className="k-help k-inh">{F.letter(d)}</span>
            <span className="k-num d3 k-inh">{Number(d.slice(8))}</span>
            {tags[d] && <span className="tag">{tags[d]}</span>}
            {level >= 1 && <Bars b={bars[d]} bg={variant === "b"} />}
            {variant === "a" && level === 2 && (
              <span className="st-col" aria-hidden="true">
                {day24(d)}
              </span>
            )}
          </a>
        ))}
      </nav>
      {level === 2 && (
        <>
          {variant === "b" && (
            <div
              className="st-rh"
              role="img"
              aria-label="Le 24 ore di ogni giorno: il sonno, i pasti, l’allenamento"
            >
              {days.map((d) => (
                <span key={d} className="day">
                  {day24(d)}
                </span>
              ))}
            </div>
          )}
          <span className="st-key">
            <span>
              <i
                style={{
                  background: "color-mix(in srgb, var(--moment-dinner) 50%, transparent)",
                }}
              />
              sonno
            </span>
            <span>
              <i style={{ background: "var(--muscle-legs)" }} />
              allenamento
            </span>
            <span>
              <i style={{ background: "var(--moment-breakfast)", borderRadius: "50%" }} />
              pasti, del colore del momento
            </span>
            <span>righe: 6 · 12 · 18</span>
          </span>
        </>
      )}
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
                aria-label={F.day(d)}
              >
                <span>{Number(d.slice(8))}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bars({ b, bg = false }: { b: DayBars | undefined; bg?: boolean }) {
  const h = (v: number | null | undefined) =>
    Math.round(Math.max(0.08, Math.min(1, v ?? 0)) * 100) + "%";
  const limitTone = (r: number) =>
    r > 1 ? "var(--heat-bad)" : r > 0.85 ? "var(--heat-fair)" : "var(--heat-good)";
  const one = (key: string, v: number | null | undefined, color: string, extra = "") =>
    v == null ? (
      <i key={key} className="none" />
    ) : (
      <i key={key} className={extra} style={{ height: h(v), background: color }} />
    );
  return (
    <span className={"k-wbars" + (bg ? " st-bg" : "")} aria-hidden="true">
      {one("f", b?.food, F.judge(b?.food == null ? undefined : b.food * 100).tone)}
      {one("l", b?.limits, b?.limits == null ? "" : limitTone(b.limits))}
      {b?.train === "planned"
        ? one("t", 1, "var(--muscle-chest)", "plan")
        : one("t", b?.train === "done" ? 1 : null, "var(--muscle-chest)")}
      {one("h", b?.habits, "var(--moment-snack)")}
    </span>
  );
}
