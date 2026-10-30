"use client";
/**
 * The day's weather on Oggi (E11; the developer's pick, 2026-10-25: «B con A
 * in espansione»), on three levels (UI-80, 30 Oct: «più gradi di
 * espandibilità… ricordata nelle aperture delle pagine»), one tap each, the
 * level kept for the next visit: 0 one line (the sky, the temperature at
 * the hour, its word, low–high); 1 the card (the sky's drawing, the day's
 * range with the hour on it, humidity, air, daylight, the city); 2 the card
 * and the curve of the hours, the air on its scale (EEA), the sun's arc.
 */
import { F, useLevel } from "@lifeos/kit";
import { airWords, skyOf, type DayChips } from "@/core/engines/environment";

const LEVEL_WORDS = ["una riga", "la scheda", "le ore, l’aria e la luce"];

export function WeatherCard({
  w,
  place,
  hour,
}: {
  w: DayChips;
  place: string;
  hour: number;
}) {
  const [level, next] = useLevel("oggi.meteo", 2, 1);
  const sky = skyOf(w.code);
  const lo = w.minC ?? 0;
  const hi = w.maxC ?? 0;
  const now = w.nowC ?? null;
  const pos = now !== null && hi > lo ? ((now - lo) / (hi - lo)) * 100 : null;
  const said =
    "Il tempo a " +
    place +
    ": " +
    [
      sky.word,
      now !== null ? F.num(now, "°C") : "",
      "minima " + F.num(lo, "°C"),
      "massima " + F.num(hi, "°C"),
    ]
      .filter(Boolean)
      .join(", ") +
    ". Mostra " +
    LEVEL_WORDS[level] +
    ": tocca per " +
    LEVEL_WORDS[(level + 1) % 3];
  const dots = (
    <span className="k-lv" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <i key={i} className={i <= level ? "on" : ""} />
      ))}
    </span>
  );
  if (level === 0)
    return (
      <div className="k-wx l0">
        <button type="button" className="k-wxhead" aria-label={said} onClick={next}>
          <Sky icon={sky.icon} />
          <span className="k-body">
            <b className="k-num">{now !== null ? Math.round(now) + "°" : "–"}</b>{" "}
            {sky.word}
          </span>
          <span className="k-help">
            {Math.round(lo)}° – {Math.round(hi)}°
          </span>
          {dots}
        </button>
      </div>
    );
  return (
    <div className={"k-wx" + (level === 2 ? " open" : "")}>
      <button type="button" className="k-wxhead" aria-label={said} onClick={next}>
        <Sky icon={sky.icon} />
        <span className="now">
          <b>{now !== null ? Math.round(now) + "°" : "–"}</b>
          <small>{sky.word}</small>
        </span>
        <span className="range" aria-hidden="true">
          <span>{Math.round(lo)}°</span>
          <span className="tr">
            <i />
            {pos !== null && (
              <b style={{ left: Math.max(0, Math.min(100, pos)) + "%" }} />
            )}
          </span>
          <span>{Math.round(hi)}°</span>
        </span>
        {dots}
      </button>
      <span className="k-wxline">
        {w.humidity !== null && <span>{F.num(w.humidity, "%")} umidità</span>}
        {w.aqi !== null && (
          <span className={w.aqi > 60 ? "warn" : ""}>{airWords(w.aqi)}</span>
        )}
        {w.daylightH !== null && <span>{F.hm(w.daylightH * 60)} di luce</span>}
        <span className="mut">{place}</span>
      </span>
      {level === 2 && (
        <div className="k-wxmore">
          <Curve hours={w.hours} hour={hour} />
          <div className="k-wxgrid">
            {w.aqi !== null && (
              <div>
                <span className="k-help">aria · {Math.round(w.aqi)}</span>
                <span
                  className="aqs"
                  role="img"
                  aria-label={airWords(w.aqi) + ", indice " + Math.round(w.aqi)}
                >
                  <b style={{ left: Math.min(100, w.aqi) + "%" }} />
                </span>
                <span className="k-help">{airWords(w.aqi)}</span>
              </div>
            )}
            {w.rise !== null && w.set !== null && (
              <div>
                <Arc rise={w.rise} set={w.set} at={hour * 60} />
                <span className="k-help">
                  {F.time(w.rise)} – {F.time(w.set)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Sky({ icon }: { icon: ReturnType<typeof skyOf>["icon"] }) {
  const cloud = (
    <path
      className="cl"
      d="M18 38h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 38z"
    />
  );
  return (
    <svg className={"k-sky-ico " + icon} viewBox="0 0 64 48" aria-hidden="true">
      {(icon === "sun" || icon === "partly") && (
        <g className="sun">
          <circle cx={icon === "sun" ? 32 : 24} cy={icon === "sun" ? 24 : 18} r="9" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1={(icon === "sun" ? 32 : 24) + 13 * Math.cos((a * Math.PI) / 180)}
              y1={(icon === "sun" ? 24 : 18) + 13 * Math.sin((a * Math.PI) / 180)}
              x2={(icon === "sun" ? 32 : 24) + 17 * Math.cos((a * Math.PI) / 180)}
              y2={(icon === "sun" ? 24 : 18) + 17 * Math.sin((a * Math.PI) / 180)}
            />
          ))}
        </g>
      )}
      {icon !== "sun" && <g className="drift">{cloud}</g>}
      {icon === "rain" &&
        [22, 32, 42].map((x) => (
          <line key={x} className="drop" x1={x} y1="41" x2={x - 3} y2="47" />
        ))}
      {icon === "snow" &&
        [22, 32, 42].map((x) => (
          <circle key={x} className="flake" cx={x} cy="44" r="1.6" />
        ))}
      {icon === "fog" &&
        [36, 41].map((y) => (
          <line key={y} className="fog" x1="14" y1={y} x2="50" y2={y} />
        ))}
      {icon === "storm" && <path className="bolt" d="M33 36l-5 8h5l-3 6 8-10h-5l3-4z" />}
    </svg>
  );
}

function Curve({ hours, hour }: { hours: (number | null)[]; hour: number }) {
  const pts = hours
    .map((t, h) => (t === null ? null : { h, t }))
    .filter((x): x is { h: number; t: number } => x !== null);
  if (pts.length < 2) return null;
  const W = 320;
  const H = 70;
  const lo = Math.min(...pts.map((p) => p.t)) - 1;
  const hi = Math.max(...pts.map((p) => p.t)) + 1;
  const x = (h: number) => 6 + (h * (W - 12)) / 23;
  const y = (t: number) => H - 14 - ((t - lo) / (hi - lo)) * (H - 26);
  const line = pts.map((p) => x(p.h).toFixed(1) + "," + y(p.t).toFixed(1)).join(" ");
  const area =
    "M" +
    x(pts[0]!.h) +
    "," +
    (H - 14) +
    " L" +
    line.replace(/ /g, " L") +
    " L" +
    x(pts.at(-1)!.h) +
    "," +
    (H - 14) +
    " Z";
  const nowP = pts.find((p) => p.h === hour);
  const top = pts.reduce((a, p) => (p.t > a.t ? p : a));
  const bot = pts.reduce((a, p) => (p.t < a.t ? p : a));
  return (
    <svg
      className="k-wxcurve"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        "Temperatura ora per ora, da " +
        Math.round(bot.t) +
        " a " +
        Math.round(top.t) +
        " gradi"
      }
    >
      <path d={area} className="ar" />
      <polyline points={line} className="ln" />
      <text x={x(top.h)} y={y(top.t) - 5} textAnchor="middle">
        {Math.round(top.t)}°
      </text>
      <text x={x(bot.h)} y={y(bot.t) - 5} textAnchor="middle">
        {Math.round(bot.t)}°
      </text>
      {nowP && <circle cx={x(nowP.h)} cy={y(nowP.t)} r="4" className="nw" />}
      {[0, 6, 12, 18, 23].map((h) => (
        <text key={h} x={x(h)} y={H - 2} textAnchor="middle">
          {String(h).padStart(2, "0")}
        </text>
      ))}
    </svg>
  );
}

function Arc({ rise, set, at }: { rise: number; set: number; at: number }) {
  const f = Math.max(0, Math.min(1, (at - rise) / Math.max(1, set - rise)));
  const a = Math.PI * (1 - f);
  const up = at >= rise && at <= set;
  return (
    <svg className="k-wxarc" viewBox="0 0 120 56" aria-hidden="true">
      <path d="M10 50 A50 40 0 0 1 110 50" className="tr" />
      <line x1="4" x2="116" y1="50" y2="50" className="hz" />
      {up && (
        <circle
          cx={60 + 50 * Math.cos(a)}
          cy={50 - 40 * Math.sin(a)}
          r="6"
          className="sn"
        />
      )}
    </svg>
  );
}
