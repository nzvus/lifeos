/**
 * The visual study's options (dossiers/visual.md §3.1, ledger UI-74), drawn
 * with the real kit on the developer's real day: development only, never
 * linked, 404 in production. Photographed in dark at 390 px for the canvas.
 */
import { notFound } from "next/navigation";
import { Box, F } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays } from "@/core/day";
import { readSettings } from "@/core/account/settings";
import { readSpans, SLEEP_KINDS } from "@/core/goals";
import { addDays } from "@/core/engines/time";
import { nightOf, sleepOfDay, sleepScore, type ScoreContext } from "@/features/day/score";
import { studioAllowed } from "@/features/studio/allowed";
import { WeekStudio } from "@/features/studio/week";
import { TimesStudio } from "@/features/studio/times";
import { PanelStudio } from "@/features/studio/panel";
import { ShapesStudio } from "@/features/studio/shapes";
import { WeatherStudio } from "@/features/studio/weather";
import { readPlace } from "@/core/account/place";
import { weatherChips } from "@/app/_server/weather";
import {
  ScoreAction,
  ScoreRuler,
  ScoreSentence,
  type ScoreSay,
} from "@/features/studio/score";

const DAY = "2026-10-29";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ scelta: string }>;
}) {
  if (!studioAllowed(process.env.NODE_ENV)) notFound();
  const { scelta } = await params;
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  if (scelta === "settimana") return <WeekStudio db={db} owner={owner} known={known} />;
  if (scelta === "orari") return <TimesStudio db={db} owner={owner} known={known} />;
  if (scelta === "pannello") return <PanelStudio db={db} owner={owner} known={known} />;
  if (scelta === "sagome") return <ShapesStudio db={db} owner={owner} known={known} />;
  if (scelta === "meteo") {
    const [place, days] = await Promise.all([
      readPlace(db, owner),
      loadDays(db, owner, DAY, DAY, known),
    ]);
    const w = place
      ? await weatherChips(place, DAY, DAY, known.clock.timeZone, 12)
      : null;
    if (!place || !w || !days[0]) notFound();
    return (
      <WeatherStudio
        w={w}
        place={place.name}
        hour={12}
        items={[...days[0].timed, ...days[0].untimed]}
      />
    );
  }
  if (scelta !== "voto") notFound();
  const [days, nights, profile] = await Promise.all([
    loadDays(db, owner, DAY, DAY, known),
    readSpans(db, owner, SLEEP_KINDS, addDays(DAY, -8), addDays(DAY, 1)),
    readSettings(db, owner),
  ]);
  const d = days[0];
  if (!d) notFound();
  const items = [...d.timed, ...d.untimed];
  const ctx: ScoreContext = {
    date: DAY,
    clock: known.clock,
    weighings: null,
    weightGoal: null,
    nights,
    sex: profile.sex,
    now: null,
    weights: known.weights,
  };
  const night = nightOf(items, ctx);
  const score = night ? sleepScore(night, items, ctx) : undefined;
  const sd = sleepOfDay(items, ctx);
  if (!night || !score || score.value === null || !sd.night) notFound();
  // The part that cost the most points: its weight times what it missed.
  const low =
    [...score.parts].sort(
      (a, b) => b.weight * (1 - b.score) - a.weight * (1 - a.score),
    )[0] ?? null;
  const short = 7 * 60 - sd.totalMin;
  const say: ScoreSay = {
    value: score.value,
    low: low ? { name: low.name, v: Math.round(low.score * 100) } : null,
    action:
      low?.name === "durata vs bisogno" && short > 0
        ? "ti sono mancati " + F.hm(short) + " per arrivare a 7 h"
        : null,
  };
  const entry = {
    fam: "sleep",
    sub: "wake",
    title: "Sveglia",
    value: F.hm(sd.totalMin),
    score,
  } as const;
  const { score: _drop, ...bare } = entry;
  const options = [
    {
      k: "1",
      title: "1 · La frase",
      why: "Il numero con la sua parola e il motivo: si legge senza imparare niente.",
      el: <ScoreSentence s={say} />,
    },
    {
      k: "2",
      title: "2 · Il righello",
      why: "Il voto contro le sue fasce, con la stessa forma delle barre dei nutrienti: una forma sola per «valore contro fasce».",
      el: <ScoreRuler s={say} />,
    },
    {
      k: "3",
      title: "3 · Cosa fare",
      why: "Il voto tradotto nell’unica cosa che lo alzerebbe: prima la decisione (P4).",
      el: <ScoreAction s={say} />,
    },
  ];
  return (
    <main className="k-page">
      <section className="k-section g2" aria-label="Il voto">
        <h2>Scelta · il voto — la tua notte del 29 ottobre</h2>
        <p className="k-help">
          Com’è oggi in v2: il riquadrino col numero e lo skyline. Sotto, tre modi nuovi
          di dire lo stesso voto.
        </p>
        <Box entry={entry} rail={false} />
      </section>
      {options.map((o) => (
        <section key={o.k} className="k-section g2" aria-label={o.title}>
          <h2>{o.title}</h2>
          <p className="k-help">{o.why}</p>
          <Box entry={bare} rail={false}>
            {o.el}
          </Box>
        </section>
      ))}
    </main>
  );
}
