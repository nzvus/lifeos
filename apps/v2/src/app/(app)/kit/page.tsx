/**
 * The renewed kit (step 4 of the visual plan, dossiers/visual.md §4, ledger
 * UI-88): every kit piece that the app's pages do not show by themselves —
 * the tokens by meaning, the type scale, the icons, the controls, the Box in
 * each variant, the parts of the day, every Field, the charts (the weight is
 * the owner's own), empty, loading and the toast. The pieces that live on a
 * page (Il giorno, the week, the times, water, weather, Nutrients) are
 * photographed there. Development only, never linked, 404 in production.
 */
import { notFound } from "next/navigation";
import {
  Box,
  Chart,
  DayPart,
  EmptyTime,
  F,
  Field,
  Glyph,
  type BoxEntry,
} from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ownerClock } from "@/app/_server/clock";
import { readNumbers } from "@/core/goals";
import { addDays, logicalDay } from "@/core/engines/time";
import { galleryAllowed } from "@/features/gallery/allowed";

/** The colour tokens by what they mean (register S2): one colour, one meaning. */
const MEANINGS: [string, string[]][] = [
  ["Fondi e testo", ["--paper", "--sheet", "--ink", "--muted", "--hairline"]],
  ["Giudizio", ["--herb", "--warn", "--tomato"]],
  ["Macro", ["--macro-protein", "--macro-carbs", "--macro-fat", "--macro-fiber"]],
  [
    "Pasti",
    ["--moment-breakfast", "--moment-lunch", "--moment-snack", "--moment-dinner"],
  ],
  [
    "Muscoli",
    [
      "--muscle-chest",
      "--muscle-back",
      "--muscle-shoulders",
      "--muscle-arms",
      "--muscle-core",
      "--muscle-legs",
    ],
  ],
  ["Aria (EEA)", ["--air-1", "--air-2", "--air-3", "--air-4", "--air-5", "--air-6"]],
];

const TYPE: [string, string][] = [
  ["title", "Oggi · 30"],
  ["section", "Il giorno · 20"],
  ["item", "Pranzo · 18"],
  ["number-hero", "2.198 kcal"],
  ["body", "Mangiato 2.198 kcal di 2.100 previste · 16"],
  ["meta", "08:31 · proteine 27 g · 14"],
];

/** One drawing per domain and the meal roles (UI-81, UI-82): bare in rows, a tile on buttons. */
const ICONS: [string, string][] = [
  ["food", "breakfast"],
  ["food", "lunch"],
  ["food", "snack"],
  ["food", "dinner"],
  ["drink", "water"],
  ["drink", "coffee"],
  ["train", "session"],
  ["train", "steps"],
  ["sleep", "sleep"],
  ["body", "weight"],
  ["mind", "checkin"],
  ["money", "movement"],
  ["habit", "habit"],
  ["goal", "goal"],
  ["env", "weather"],
];

const SCORE = {
  value: 64,
  parts: [
    { name: "durata vs bisogno", score: 0.48, weight: 0.35 },
    { name: "continuità", score: 0.8, weight: 0.35 },
    { name: "orario", score: 0.9, weight: 0.1 },
    { name: "regolarità", score: 0.55, weight: 0.2 },
  ],
  missing: [],
  action: "ti sono mancati " + F.hm(70) + " per arrivare a " + F.num(7, "h"),
};

/** Example values, declared so: a board never passes them for the owner's (memory v2-boards-kit). */
const BOXES: [string, string, BoxEntry, "card" | "row"][] = [
  [
    "box-pasto",
    "Box · un pasto",
    {
      fam: "food",
      sub: "lunch",
      title: "Pranzo",
      value: "742 kcal",
      meta: "13:05 · proteine 41 g",
      time: "13:05",
      pills: [{ t: "pasta" }, { t: "ceci" }, { t: "olio" }],
    },
    "card",
  ],
  [
    "box-previsto",
    "Box · previsto (tratteggio)",
    {
      fam: "food",
      sub: "dinner",
      title: "Cena prevista",
      value: "≈ 650 kcal",
      time: "20:00",
      planned: true,
    },
    "card",
  ],
  [
    "box-sessione",
    "Box · una sessione",
    {
      fam: "train",
      of: { kind: "session" },
      title: "Push",
      value: "58 min",
      meta: "6 esercizi · 18 serie · ≈ 310 kcal",
      time: "18:10",
      strip: [
        { w: 45, c: "var(--muscle-chest)" },
        { w: 35, c: "var(--muscle-shoulders)" },
        { w: 20, c: "var(--muscle-arms)" },
      ],
    },
    "card",
  ],
  [
    "box-voto",
    "Box · col voto (chiuso)",
    { fam: "sleep", sub: "wake", title: "Sveglia", value: "5 h 50", score: SCORE },
    "card",
  ],
  [
    "box-riga",
    "Box · riga densa",
    {
      fam: "body",
      of: { kind: "weight" },
      title: "Peso",
      value: "78,4 kg",
      meta: "07:40",
    },
    "row",
  ],
  [
    "box-sbiadito",
    "Box · saltato",
    {
      fam: "habit",
      of: { kind: "habit" },
      title: "Stretching",
      meta: "saltato",
      faded: true,
    },
    "row",
  ],
];

export default async function KitPage() {
  if (!galleryAllowed(process.env.NODE_ENV)) notFound();
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const weighings = (
    await readNumbers(db, owner, "weigh_in", "weightKg", addDays(today, -59), today)
  ).sort((a, b) => a.day.localeCompare(b.day));
  const ys = weighings.map((w) => w.n);
  const lo = Math.floor(Math.min(...ys) - 1);
  const hi = Math.ceil(Math.max(...ys) + 1);
  return (
    <main className="k-page">
      <section className="k-section g3" id="token" aria-label="Colori per significato">
        <h2>Colori per significato</h2>
        {MEANINGS.map(([name, tokens]) => (
          <div key={name} className="k-stack g1">
            <span className="k-label">{name}</span>
            <div className="k-line g2" style={{ flexWrap: "wrap" }}>
              {tokens.map((t) => (
                <span key={t} className="k-stack g1" style={{ width: 52 }}>
                  <span
                    style={{
                      height: 32,
                      borderRadius: "var(--radius-control)",
                      background: `var(${t})`,
                      boxShadow: "inset 0 0 0 1px var(--hairline)",
                    }}
                  />
                  <span className="k-help">
                    {t.replace(/^--(macro-|moment-|muscle-)?/, "")}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="k-section g2" id="tipi" aria-label="Tipografia">
        <h2>Tipografia</h2>
        {TYPE.map(([cls, text]) => (
          <span key={cls} className={cls}>
            {text}
          </span>
        ))}
      </section>

      <section className="k-section g3" id="icone" aria-label="Icone">
        <h2>Icone</h2>
        <div className="k-line g3" style={{ flexWrap: "wrap" }}>
          {ICONS.map(([fam, kind]) => (
            <span key={fam + kind} className={"fam-" + fam + " sub-" + kind}>
              <Glyph of={{ fam, kind, sub: kind }} size="l" />
            </span>
          ))}
        </div>
        <span className="k-label">Su un pulsante: la piastrella piena</span>
        <div className="k-line g3" style={{ flexWrap: "wrap" }}>
          {ICONS.slice(0, 8).map(([fam, kind]) => (
            <span key={fam + kind} className={"fam-" + fam + " sub-" + kind}>
              <Glyph of={{ fam, kind, sub: kind }} size="m" tile />
            </span>
          ))}
        </div>
        <span className="k-label">Misure: xs · s · m · l · xl</span>
        <div className="k-line g3 base">
          {(["xs", "s", "m", "l", "xl"] as const).map((s) => (
            <Glyph key={s} of={{ fam: "food", sub: "breakfast" }} size={s} />
          ))}
        </div>
      </section>

      <section className="k-section g3" id="controlli" aria-label="Controlli">
        <h2>Controlli</h2>
        <button type="button" className="k-primary">
          Salva il pasto
        </button>
        <div className="k-line g2">
          <button type="button" className="k-btn secondary">
            Annulla
          </button>
          <button type="button" className="k-btn link">
            Mostra altri
          </button>
          <button type="button" className="k-icon-btn" aria-label="Altro">
            <Glyph of={{ ui: "more" }} size="m" />
          </button>
        </div>
        <div className="k-chips">
          <button type="button" className="k-chip on" aria-pressed="true">
            Tutto
          </button>
          <button type="button" className="k-chip" aria-pressed="false">
            Cibo
          </button>
          <button type="button" className="k-chip" aria-pressed="false">
            Corpo
          </button>
          <button type="button" className="k-chip" aria-pressed="false">
            Previsti
          </button>
        </div>
      </section>

      <section className="k-section g2" id="box" aria-label="Box">
        <h2>Box</h2>
        {BOXES.map(([id, label, entry, density]) => (
          <figure
            key={id}
            id={id}
            aria-label={label}
            className="k-stack g1"
            style={{ margin: 0 }}
          >
            <figcaption className="k-label">{label}</figcaption>
            <Box entry={entry} density={density} />
          </figure>
        ))}
        <figure
          id="box-aperto"
          aria-label="Box · col voto, aperto"
          className="k-stack g1"
          style={{ margin: 0 }}
        >
          <figcaption className="k-label">Box · col voto, aperto</figcaption>
          <Box entry={BOXES[3]![2]} expanded />
        </figure>
      </section>

      <section className="k-section g2" id="parti" aria-label="Le parti del giorno">
        <h2>Le parti del giorno</h2>
        <DayPart name="Mattina" when="dalle 05:00" />
        <DayPart name="Mezzogiorno" when="dalle 12:00" />
        <DayPart name="Pomeriggio" when="dalle 15:00" empty />
        <EmptyTime
          minutes={150}
          label="2 h 30 senza niente"
          href="/aggiungi"
          what="+ Merenda"
        />
        <DayPart name="Sera" when="dalle 19:00" />
        <DayPart name="Notte" when="dalle 23:00" />
        <DayPart name="Fine giornata" when="alle 04:00" />
      </section>

      <section className="k-section g3" id="campi" aria-label="Campi">
        <h2>Campi</h2>
        <Field
          name="g"
          label="Quantità"
          type="stepper"
          defaultValue="80"
          unit="g"
          step={5}
        />
        <Field
          name="fame"
          label="Fame"
          type="scale"
          defaultValue="3"
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
          help="1 nessuna · 5 molta"
        />
        <Field
          name="pasto"
          label="Pasto"
          type="choice"
          defaultValue="lunch"
          options={[
            { value: "breakfast", label: "Colazione" },
            { value: "lunch", label: "Pranzo" },
            { value: "snack", label: "Spuntino" },
            { value: "dinner", label: "Cena" },
          ]}
        />
        <Field name="ora" label="Ora" type="time" defaultValue="13:05" />
        <Field name="nota" label="Nota" type="text" placeholder="Com’è andata" />
        <Field
          name="kg"
          label="Peso"
          type="stepper"
          defaultValue="0"
          unit="kg"
          error="Scrivi un peso tra 30 e 300 kg"
        />
      </section>

      <section className="k-section g3" id="grafici" aria-label="Grafici">
        <h2>Grafici</h2>
        {ys.length > 1 && (
          <Chart
            type="trend"
            caption={"Il tuo peso, " + F.num(ys.length) + " pesate in 60 giorni"}
            data={{
              x: weighings.map((w, i) => (i % 6 === 0 ? w.day.slice(8) : "")),
              y: ys,
              unit: "kg",
              lo,
              hi,
              decimals: 1,
            }}
          />
        )}
        <Chart
          type="bars"
          caption="Esempio: proteine al giorno contro la fascia che basta"
          data={{
            x: ["L", "M", "M", "G", "V", "S", "D"],
            y: [142, 165, 120, 158, 171, 98, 150],
            unit: "g",
            lo: 0,
            hi: 200,
            bandLo: 130,
            bandHi: 175,
            decimals: 0,
          }}
        />
      </section>

      <section
        className="k-section g3"
        id="stati"
        aria-label="Vuoto, caricamento, avviso"
      >
        <h2>Vuoto, caricamento, avviso</h2>
        <div className="k-empty">
          <Glyph of={{ fam: "food", kind: "meal" }} size="xl" decorative />
          <span className="t">Ancora niente oggi</span>
          <span className="k-body">Il primo pasto o un bicchiere d’acqua: tocca ⊕.</span>
          <a className="k-btn primary" href="/aggiungi">
            Aggiungi
          </a>
        </div>
        <div className="k-stack g2" aria-hidden="true">
          <span className="k-skel title" />
          <span className="k-skel card" />
          <span className="k-skel row" />
        </div>
        <div className="k-toast" role="status">
          <span>Pranzo segnato come fatto</span>
          <button type="button" className="k-btn link">
            Annulla
          </button>
        </div>
      </section>
    </main>
  );
}
