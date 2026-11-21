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
  DAYS_EXAMPLE,
  FORM_ITEMS,
  MICROS_9NOV,
  TREE_KCAL,
  TREE_MICROS,
  TREE_PLANNED,
  TREE_PROTEIN,
  TREE_VOTO,
  VOTO_SAMPLES,
  MEAL_SAMPLE,
  MEAL_SCORE,
} from "./samples";
import { ENGINE_SAMPLES } from "./engine-samples";
import {
  Box,
  Chart,
  DayPart,
  EmptyTime,
  F,
  Field,
  Glyph,
  MealBox,
  PartsBand,
  PlanBox,
  Forms,
  MeasureDays,
  MeasureTree,
  MeasureView,
  Nutrients,
  type BoxEntry,
} from "@lifeos/kit";
import { common } from "@/i18n/common";
import { mealSlots } from "@/features/box/meal";
import { ActionSample } from "./action-sample";
import { KinSample } from "./kin-sample";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ownerClock } from "@/app/_server/clock";
import { readNumbers } from "@/core/goals";
import { addDays, logicalDay } from "@/core/engines/time";
import { galleryAllowed } from "@/features/gallery/allowed";
import { Pieces } from "@/features/gallery/Pieces";

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
  // one criterion that does not count, with why, and its page (his 19 Nov)
  missing: ["come ti senti (mancano i dati)"],
  how: "/oggi/andamento/come-valutiamo?modello=sleep",
  action: "ti sono mancati " + F.hm(70) + " per arrivare a " + F.num(7, "h"),
};

/** Example values, declared so: a board never passes them for the owner's (memory v2-boards-kit). */
/** The one box of a meal (PAT-30, PAT-43), as a row: shut, and opened in place. */
const THINGS: [string, boolean][] = [
  ["Box di una cosa · riga chiusa", false],
  ["Box di una cosa · aperta sul posto", true],
];
const MEALS: [string, boolean][] = [
  ["Box di un pasto · riga chiusa", false],
  ["Box di un pasto · aperto sul posto", true],
];

/** A Box with levels (VIS-40, «Oggi a livelli»): closed, open, one door open. */
const LEVELS: [string, string, boolean, string | null][] = [
  ["box-livello-0", "Box a livelli · chiuso: una riga e la striscia", false, null],
  ["box-livello-1", "Box a livelli · aperto, con le porte", true, null],
  ["box-livello-2", "Box a livelli · una porta aperta (Voto)", true, "voto"],
];

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

export default async function KitPage({
  searchParams,
}: {
  searchParams: Promise<{ aperto?: string | string[] }>;
}) {
  if (!galleryAllowed(process.env.NODE_ENV, process.env.KIT_GALLERY)) notFound();
  const owner = await requireOwner();
  const { aperto } = await searchParams;
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
        <DayPart name="Pomeriggio" when="dalle 12:00" empty />
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
        <Field name="giorno" label="Dal giorno" type="date" defaultValue="2026-11-10" />
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
      {/* «Ogni quanto» (PAT-61, PL-20): empty, then each kind with its own control. */}
      <section className="k-section g3" id="ogni-quanto" aria-label="Ogni quanto">
        <h2>Ogni quanto</h2>
        <Field
          name="mai"
          label="Ogni quanto"
          type="recurrence"
          today="2026-11-10"
          error="Scegli ogni quanto"
        />
        <Field
          name="giorni"
          label="Ogni quanto"
          type="recurrence"
          today="2026-11-10"
          defaultValue={'{"type":"weekdays","days":[1,3,5]}'}
        />
        <Field
          name="ogni"
          label="Ogni quanto"
          type="recurrence"
          today="2026-11-10"
          defaultValue={'{"type":"everyN","n":3,"start":"2026-11-10"}'}
        />
        <Field
          name="volte"
          label="Ogni quanto"
          type="recurrence"
          today="2026-11-10"
          defaultValue={'{"type":"timesPerWeek","n":3}'}
        />
        <Field
          name="date"
          label="Ogni quanto"
          type="recurrence"
          today="2026-11-10"
          defaultValue={'{"type":"onDates","dates":["2026-11-12","2026-11-15"]}'}
        />
        <Field
          name="ciclo"
          label="Ogni quanto"
          type="recurrence"
          today="2026-11-10"
          defaultValue={'{"type":"inCycle"}'}
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

      <section className="k-section g3" id="stati" aria-label="Caricamento">
        <h2>Caricamento</h2>
        <div className="k-stack g2" aria-hidden="true">
          <span className="k-skel title" />
          <span className="k-skel card" />
          <span className="k-skel row" />
        </div>
      </section>

      <Pieces open={typeof aperto === "string" ? aperto : null} />

      {/* After the photographed pieces (e2e/kit.spec.ts): a section added above them moves
          them by a fraction of a pixel and fails their photos. */}
      {/* The voto opened (VIS-43, his pick of 19 Nov: C «punti» with the macros' grammar), on his
          own numbers: the Porridge of 9 Nov, his water, and a planned meal (hatched). */}
      <section className="k-section g2" id="voto" aria-label="Il voto aperto">
        <h2>Il voto aperto</h2>
        {VOTO_SAMPLES.map(([key, label, entry]) => (
          <div
            key={key}
            id={"voto-" + key}
            role="group"
            aria-label={label}
            className="k-stack g1"
          >
            <span className="k-label">{label}</span>
            <Box
              entry={entry}
              expanded
              doors={[
                {
                  key: "nutrients",
                  label: "Nutrienti",
                  panel: <p className="k-meta">…</p>,
                },
              ]}
              door="voto"
            />
          </div>
        ))}
      </section>

      {/* The micros as macro rows in their group's colours (his 19 Nov «gli stessi criteri delle
          macro»), on his micros of 9 Nov. */}
      <section className="k-section g2" id="micro" aria-label="I micro">
        <h2>I micro</h2>
        <Nutrients data={MICROS_9NOV} part="rest" />
      </section>

      {/* Bars study §6 (his 19 Nov: no words on the bar; «altri tipi… non necessariamente
          barre»): three forms on his micros of 9 Nov, every item shown (not condensed). */}
      <section className="k-section g2" id="forme" aria-label="Forme: proposte">
        <h2>Forme · proposte</h2>
        {(
          [
            ["thin", "V1 · sottile (le fasce come sfondo)"],
            ["tiles", "V2 · tessere"],
            ["rings", "V3 · anelli"],
          ] as const
        ).map(([look, label]) => (
          <div
            key={look}
            id={"forma-" + look}
            role="group"
            aria-label={label}
            className="k-stack g1"
          >
            <span className="k-label">{label}</span>
            <Forms items={FORM_ITEMS} look={look} />
          </div>
        ))}
      </section>

      {/* Bars study §7 (his 20 Nov «aggregati… densità informativa»): one construct, a node
          and its children under it, on his 9 Nov. */}
      <section
        className="k-section g3"
        id="albero"
        aria-label="Misure e aggregati: prova"
      >
        <h2>Misure e aggregati · prova</h2>
        <MeasureTree node={TREE_KCAL} />
        <MeasureTree node={TREE_PLANNED} />
        <MeasureTree node={TREE_PROTEIN} />
        <MeasureTree node={TREE_VOTO} />
        {TREE_MICROS.map((n) => (
          <MeasureTree key={n.name} node={n} />
        ))}
        <MeasureDays {...DAYS_EXAMPLE} />
      </section>

      {/* The visualization engine, slice 2 (MOD-56): three classes, each asked with a frame and
          a level; every drawing below is the engine's, none picked here. */}
      <section className="k-section g3" id="motore" aria-label="Il motore: tre classi">
        <h2>Il motore · tre classi</h2>
        {ENGINE_SAMPLES.map((s, i) => (
          <div key={i} className="k-stack">
            <span className="k-meta">
              {s.cls} · {s.asked}
            </span>
            <MeasureView view={s.view} />
          </div>
        ))}
      </section>

      <section className="k-section g2" id="box-livelli" aria-label="Box a livelli">
        <h2>Box a livelli</h2>
        {LEVELS.map(([id, label, expanded, door]) => (
          <div key={id} id={id} role="group" aria-label={label} className="k-stack g1">
            <span className="k-label">{label}</span>
            <Box
              entry={{
                ...BOXES[3]![2],
                strip: [
                  { w: 9, c: "var(--macro-protein)" },
                  { w: 22, c: "var(--macro-carbs)" },
                  { w: 6, c: "var(--macro-fat)" },
                  { w: 2, c: "var(--macro-fiber)" },
                ],
              }}
              expanded={expanded}
              doors={[
                {
                  key: "nutrients",
                  label: "Nutrienti",
                  panel: <p className="k-meta">…</p>,
                },
                {
                  key: "foods",
                  label: "Cibi",
                  value: "5",
                  panel: <p className="k-meta">…</p>,
                },
                { key: "more", label: "Costo", value: "≈ 1,10 €" },
              ]}
              door={door}
            />
          </div>
        ))}
      </section>

      <section className="k-section g2" id="azioni-box" aria-label="Le azioni di un box">
        <h2>Le azioni di un box</h2>
        <ActionSample />
      </section>

      <section className="k-section g2" id="kin" aria-label="Genitori e figli">
        <h2>Genitori e figli</h2>
        <KinSample />
      </section>

      <section className="k-section g2" id="banda" aria-label="La banda di un intero">
        <h2>La banda di un intero</h2>
        {/* Clipped in a frame: in the gallery it never sticks over the other pieces. */}
        <div className="k-bandframe">
          <PartsBand
            data={MEAL_SAMPLE}
            anchor="banda-nessuna"
            label="Il giorno"
            startShown
          />
        </div>
      </section>

      <section className="k-section g2" id="pasto-box" aria-label="Il box di un pasto">
        <h2>Il box di un pasto</h2>
        {MEALS.map(([label, open]) => (
          <div key={label} role="group" aria-label={label} className="k-stack g1">
            <span className="k-label">{label}</span>
            <MealBox
              density="row"
              startOpen={open}
              entry={{
                fam: "food",
                of: { kind: "meal" },
                title: "Porridge proteico: lamponi, cioccolato, nocciola",
                value: F.num(533, "kcal"),
                score: MEAL_SCORE,
                href: "#pasto-box",
              }}
              data={MEAL_SAMPLE}
              slots={mealSlots({
                details: { stats: [], lines: [], foot: "aggiunto al volo" },
              })}
              actions={[
                { key: "log", label: "Registra", href: "#pasto-box" },
                { key: "compose", label: "Cambia i cibi", href: "#pasto-box" },
              ]}
            />
          </div>
        ))}
      </section>

      <section className="k-section g2" id="cosa-box" aria-label="Il box di una cosa">
        <h2>Il box di una cosa</h2>
        {THINGS.map(([label, open]) => (
          <div key={label} role="group" aria-label={label} className="k-stack g1">
            <span className="k-label">{label}</span>
            <PlanBox
              density="row"
              startOpen={open}
              entry={{
                fam: "food",
                of: { kind: "ingredient", group: "cereals" },
                title: "Fiocchi d’avena integrali",
                value: F.num(372, "kcal") + "/100",
                score: SCORE,
                href: "#cosa-box",
              }}
              variantsLabel="Marche"
              picked="b"
              variants={[
                ["a", "Esselunga", 4.2, 372, "1"],
                ["b", "Quaker", 5.9, 379, "1"],
                ["c", "Coop", null, 368, "3"],
              ].map(([key, label, perKg, kcal, nova]) => ({
                key: String(key),
                label: String(label),
                ...(perKg ? { meta: F.num(Number(perKg), "€") + "/kg" } : {}),
                head: { value: F.num(Number(kcal), "kcal") + "/100" },
                slots: [
                  {
                    key: "nutrients",
                    label: common.doors.nutrients,
                    value: F.num(100, "g"),
                    nutrients: {
                      macros: [
                        { key: "protein", v: 13 },
                        { key: "carbs", v: 59 },
                        { key: "fat", v: 7 },
                        { key: "fiber", v: 10 },
                      ],
                    },
                  },
                  { key: "nova", label: "NOVA", word: String(nova) },
                ],
              }))}
            />
            <PlanBox
              density="row"
              startOpen={open}
              entry={{
                fam: "train",
                of: { kind: "exercise" },
                title: "Panca piana con bilanciere",
                href: "#cosa-box",
              }}
              slots={[
                {
                  key: "e1rm",
                  label: "e1RM",
                  value: F.num(85, "kg"),
                  caption: "e1RM, le ultime 4 sessioni",
                  trend: {
                    x: ["3 nov", "", "", "17 nov"],
                    y: [80, 82.5, 83, 85],
                    unit: "kg",
                    lo: 80,
                    hi: 85,
                    decimals: 1,
                  },
                },
                {
                  key: "facts",
                  label: "Fatti",
                  words: ["Spinta orizzontale", "Bilanciere", "Petto"],
                },
              ]}
            />
          </div>
        ))}
      </section>
    </main>
  );
}
