/**
 * The visual study's open choices, round 2 (dossiers/visual.md §3.4, ledger
 * UI-75 il voto, UI-76 la settimana, UI-77 gli orari), drawn with the real kit
 * on the developer's real days: development only, never linked, 404 in
 * production. Photographed in dark at 390 px for the canvas.
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
import {
  SCORE_CSS,
  ScoreHead,
  ScoreLine,
  ScoreOpen,
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
  const parts = score.parts;
  return (
    <main className="k-page">
      <style>{SCORE_CSS}</style>
      <section className="k-section g2" aria-label="Il voto">
        <h2>Il voto, secondo giro — la tua notte del 29 ottobre</h2>
        <p className="k-help">
          Hai scritto: «mi piace sia lo skyline, e anche 2, visivamente, ma a livello
          informativo meglio 1 e 3, una combinazione?». Prima com’è oggi in v2.
        </p>
        <Box entry={entry} rail={false} />
      </section>
      <section className="k-section g2" aria-label="La combinazione, chiusa">
        <h2>La combinazione · chiuso</h2>
        <p className="k-help">
          Lo skyline senza cornice, ogni colonna del colore della sua fascia (il
          righello); accanto il numero con la sua parola; sotto il titolo una riga sola:
          cosa fare quando l’app lo sa, altrimenti cosa è costato di più.
        </p>
        <Box entry={bare} rail={false} chip={<ScoreHead s={say} parts={parts} />}>
          <ScoreLine s={say} />
        </Box>
        <Box
          entry={bare}
          rail={false}
          chip={<ScoreHead s={{ ...say, action: null }} parts={parts} />}
        >
          <ScoreLine s={{ ...say, action: null }} />
        </Box>
        <p className="k-help">
          Sopra: l’azione è nota (la durata). Sotto: la stessa notte quando l’app non sa
          dire cosa fare.
        </p>
      </section>
      <section className="k-section g2" aria-label="La combinazione, aperta">
        <h2>La combinazione · aperto, terzo giro</h2>
        <p className="k-help">
          Hai scritto «aperto fa un po’ schifo». Ora ogni criterio è una riga col righello
          dei nutrienti: pieno fino al suo voto, le fasce 40 e 70 sotto, la punta del
          colore della sua fascia, e accanto quanto pesa. Lo skyline resta piccolo in
          cima.
        </p>
        <Box
          entry={bare}
          rail={false}
          expanded
          chip={<ScoreHead s={say} parts={parts} />}
        >
          <ScoreLine s={say} />
          <ScoreOpen parts={parts} />
        </Box>
      </section>
    </main>
  );
}
