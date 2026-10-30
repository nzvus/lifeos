/**
 * Visual study, choice «il meteo» (dossiers/visual.md §3.1 and §3.2, ledger
 * UI-74, D4): the card as v2 draws it today, beside three rethought ways on the
 * developer's 29 October. Local study only; the page fetches the weather (app
 * side) and passes it in.
 *   1 · in the date: one line under the date, no card
 *   2 · only when it matters: the weather speaks only where it changes something
 *   3 · on the day's hours: the temperature as a 24-hour strip, the day's things on it
 */
import type { CSSProperties } from "react";
import { F } from "@lifeos/kit";
import { airWords, skyOf, type DayChips } from "@/core/engines/environment";
import type { DayItem } from "@/core/day";
import { WeatherCard } from "@/features/day/WeatherCard";
import { present } from "@/features/day/present";

const HEAT_C = 25;

export function WeatherStudio({
  w,
  place,
  hour,
  items,
}: {
  w: DayChips;
  place: string;
  hour: number;
  items: readonly DayItem[];
}) {
  const sky = skyOf(w.code);
  const lo = w.minC ?? 0;
  const hi = w.maxC ?? 0;
  const at = (min: number) =>
    w.hours[Math.max(0, Math.min(23, Math.floor(min / 60)))] ?? null;
  const sessions = items.filter(
    (i) => i.kind.key === "session" && i.status === "done" && i.minute !== null,
  );
  const marks = items.filter(
    (i) =>
      (i.kind.key === "meal" || i.kind.key === "session") &&
      i.status === "done" &&
      i.minute !== null,
  );
  const says = [
    ...sessions.map((s) => {
      const c = at(s.minute!);
      return (
        present(s).title +
        " alle " +
        F.time(s.minute!) +
        (c !== null ? ": " + F.num(c, "°C") : "")
      );
    }),
    ...(hi > HEAT_C ? ["caldo, fino a " + F.num(hi, "°C") + ": bevi di più"] : []),
    ...(w.aqi !== null && w.aqi > 60
      ? [airWords(w.aqi) + ": meglio allenarsi al chiuso"]
      : []),
    ...(w.set !== null ? ["luce fino alle " + F.time(w.set)] : []),
  ];
  const tone = (c: number | null) =>
    c === null
      ? "var(--hairline)"
      : "color-mix(in srgb, var(--warn) " +
        Math.round(((c - lo) / Math.max(1, hi - lo)) * 100) +
        "%, var(--macro-fat))";
  return (
    <main className="k-page">
      <section className="k-section g2" aria-label="Com’è oggi">
        <h2>Scelta · il meteo — Oggi del 29 ottobre</h2>
        <p className="k-help">
          Com’è oggi in v2 (la tua scelta del 25 ottobre: «B con A in espansione»): una
          scheda sotto la data, che si apre sulle ore, l’aria e il sole.
        </p>
        <WeatherCard w={w} place={place} hour={hour} />
      </section>

      <section className="k-section g2" aria-label="1 · Nella data">
        <h2>1 · Nella data</h2>
        <p className="k-help">
          Niente scheda: una riga sola sotto la data. Il meteo è contesto, non una cosa da
          guardare.
        </p>
        <span className="k-line base g2 wrap">
          <span className="k-num b2">
            {w.nowC !== null ? Math.round(w.nowC) + "°" : "–"}
          </span>
          <span className="k-body">{sky.word}</span>
          <span className="k-meta">
            {Math.round(lo)}–{Math.round(hi)}° ·{" "}
            {w.aqi !== null ? airWords(w.aqi) : "aria –"} · {place}
          </span>
        </span>
      </section>

      <section className="k-section g2" aria-label="2 · Solo quando conta">
        <h2>2 · Solo quando conta</h2>
        <p className="k-help">
          Il meteo parla solo dove cambia qualcosa per te: la temperatura all’ora
          dell’allenamento, il caldo che chiede acqua, l’aria scarsa, la luce. Se niente
          conta, non c’è.
        </p>
        <ul className="k-stack g1">
          {says.map((t) => (
            <li key={t} className="k-body">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="k-section g2" aria-label="3 · Sulle ore del giorno">
        <h2>3 · Sulle ore del giorno</h2>
        <p className="k-help">
          La temperatura come una striscia di 24 ore, dal freddo (blu) al caldo (arancio);
          sopra, i tuoi pasti e l’allenamento alla loro ora: com’era fuori quando facevi
          le cose.
        </p>
        <div className="k-stack g1">
          <span className="k-rel" style={{ height: "14px", width: "100%" }}>
            {marks.map((m) => (
              <span
                key={m.id}
                title={present(m).title}
                style={
                  {
                    position: "absolute",
                    left: "calc(" + ((m.minute! / 1440) * 100).toFixed(1) + "% - 3px)",
                    top: "4px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background:
                      m.kind.key === "session" ? "var(--muscle-legs)" : "var(--ink)",
                  } as CSSProperties
                }
              />
            ))}
          </span>
          <span
            className="k-line g0"
            style={{ height: "18px" }}
            role="img"
            aria-label={
              "temperatura dalle 0 alle 23: da " +
              F.num(lo, "°C") +
              " a " +
              F.num(hi, "°C")
            }
          >
            {w.hours.map((c, h) => (
              <span key={h} style={{ flex: 1, height: "18px", background: tone(c) }} />
            ))}
          </span>
          <span className="k-line between">
            <span className="k-meta">00</span>
            <span className="k-meta">06</span>
            <span className="k-meta">12</span>
            <span className="k-meta">18</span>
            <span className="k-meta">24</span>
          </span>
        </div>
      </section>
    </main>
  );
}
