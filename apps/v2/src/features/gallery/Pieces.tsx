"use client";
/**
 * The phase 3 pieces in the `/kit` gallery (change 2026-11-06-guards, PAT-94): each with the
 * states that matter, example values only. `open` («?aperto=altro|conferma|perche|toast»)
 * shows a sheet or the toast at once, so the CI screenshots can photograph them.
 */
import { useEffect, useState } from "react";
import {
  Banner,
  Confirm,
  EmptyState,
  EntryHeader,
  Find,
  ObjectActions,
  ObjectForm,
  SortChips,
  Unknown,
  Why,
  useToast,
  type FindItem,
  type FormFieldSpec,
  type WhyDeclaration,
} from "@lifeos/kit";

const EXERCISES: FindItem[] = [
  {
    id: "1",
    name: "Panca piana",
    uses: 31,
    hours: [18, 18, 19],
    meta: "Petto · 31 volte",
    tags: ["petto"],
  },
  {
    id: "2",
    name: "Panca inclinata manubri",
    uses: 12,
    hours: [18],
    meta: "Petto · 12 volte",
    tags: ["petto"],
  },
  {
    id: "3",
    name: "Trazioni presa prona",
    aliases: ["pull-up"],
    uses: 20,
    hours: [7, 18],
    meta: "Schiena · 20 volte",
    tags: ["schiena"],
  },
  {
    id: "4",
    name: "Rematore con bilanciere, presa supina e schiena a 45 gradi",
    uses: 4,
    hours: [18],
    meta: "Schiena · un nome lungo che va a capo",
    tags: ["schiena"],
  },
  {
    id: "5",
    name: "Squat",
    uses: 18,
    hours: [18],
    meta: "Gambe · 18 volte",
    tags: ["gambe"],
  },
];

const ROUTE_FIELDS: FormFieldSpec[] = [
  {
    key: "mode",
    label: "Mezzo",
    type: "choice",
    required: true,
    choices: [
      { value: "walk", label: "A piedi" },
      { value: "bike", label: "Bici" },
      { value: "bus", label: "Bus" },
    ],
  },
  {
    key: "distanceKm",
    label: "Distanza",
    type: "number",
    unit: "km",
    min: 0,
    help: "Solo andata",
  },
  {
    key: "walkingM",
    label: "Di cui a piedi",
    type: "integer",
    unit: "m",
    min: 0,
    step: 50,
  },
  { key: "mapsUrl", label: "Link alla mappa", type: "text" },
];

const PROTEIN: WhyDeclaration = {
  title: "Proteine di oggi",
  formula: "La somma delle proteine di ogni voce mangiata oggi, dalla sua istantanea.",
  inputs: [
    { label: "Colazione", value: "24 g", confidence: "label" },
    { label: "Pranzo", value: "42 g", confidence: "weighed" },
    { label: "Spuntino", value: "15 g", source: "Ciqual 2020", confidence: "assumed" },
  ],
  coverage: { have: 3, of: 4, need: 3, unit: "pasti" },
  fascia: { words: "buono da 1,6 a 2,2 g per kg", source: "ISSN, Jäger et al. 2017" },
  version: "proteine v2 · 6 nov 2026",
};

export function Pieces({ open }: { open: string | null }) {
  const [sheet, setSheet] = useState<string | null>(
    open === "conferma" ? "conferma" : null,
  );
  const [sort, setSort] = useState("use");
  const [picked, setPicked] = useState<string | null>(null);
  const { say, toast } = useToast();
  useEffect(() => {
    if (open === "toast") say("Panca piana archiviata", () => undefined);
  }, [open, say]);
  return (
    <>
      <section className="k-section g3" id="cerca" aria-label="Cerca e ordina">
        <h2>Cerca e ordina (PAT-41, PAT-42)</h2>
        <SortChips
          keys={[
            { key: "use", label: "Più usati" },
            { key: "name", label: "Nome" },
            { key: "recent", label: "Recenti" },
          ]}
          value={sort}
          onChange={setSort}
        />
        <Find
          label="Cerca un esercizio"
          hour={18}
          items={EXERCISES}
          filters={[
            { key: "petto", label: "Petto" },
            { key: "schiena", label: "Schiena" },
            { key: "gambe", label: "Gambe" },
          ]}
          onPick={(i) => setPicked(i.name)}
        />
        {picked && <p className="k-meta">Scelto: {picked}</p>}
      </section>

      <section
        className="k-section g3"
        id="azioni"
        aria-label="Azioni su una cosa che riusi"
      >
        <h2>Azioni su una cosa che riusi (PAT-16…23)</h2>
        <ObjectActions
          title="Panca piana"
          verbs={["startFrom", "variant", "archive", "merge", "saveAs", "delete"]}
          onVerb={(v) =>
            v === "merge" || v === "delete"
              ? setSheet("conferma")
              : say("Fatto: " + v, () => undefined)
          }
          {...(open === "altro" ? { initiallyOpen: true } : {})}
        />
        <ObjectActions
          title="Panca stretta (archiviata)"
          verbs={["startFrom", "archive", "restore"]}
          archived
          onVerb={() => say("Ripristinata", () => undefined)}
        />
      </section>

      <section className="k-section g3" id="voce" aria-label="Testa di una voce">
        <h2>Testa di una voce (PAT-31)</h2>
        <EntryHeader
          amount="× 1,5"
          when={{ time: "13:05", status: "done" }}
          onStep={() => undefined}
          onMore={() => setSheet("conferma")}
        />
        <EntryHeader
          amount="80 g"
          when={{ time: "20:00", status: "planned" }}
          onRefresh={() => say("Aggiornato ai valori attuali", () => undefined)}
          onMore={() => undefined}
        />
        <EntryHeader
          amount="1 caffè"
          when={{ time: "16:30", status: "skipped" }}
          onMore={() => undefined}
        />
      </section>

      <section
        className="k-section g3"
        id="modulo"
        aria-label="Modulo generato dai campi"
      >
        <h2>Modulo generato dai campi (PAT-61, PAT-72)</h2>
        <ObjectForm
          fields={ROUTE_FIELDS}
          values={{ mode: "bike", distanceKm: 4.2 }}
          errors={{ walkingM: "Scrivi un numero intero" }}
          error="Non salvato: la rete non risponde. Quello che hai scritto resta qui."
          onRetry={() => say("Salvato", () => undefined)}
          action={() => say("Salvato", () => undefined)}
        />
      </section>

      <section className="k-section g3" id="numeri" aria-label="Perché e non so">
        <h2>Perché? e non so (PAT-51, PAT-55)</h2>
        <p className="k-body">
          Proteine{" "}
          <Why decl={PROTEIN} {...(open === "perche" ? { initiallyOpen: true } : {})}>
            <span className="k-num d3">81 g</span>
          </Why>
        </p>
        <Unknown missing={["il peso di ieri", "la cena"]} />
      </section>

      <section className="k-section g3" id="stati-nuovi" aria-label="Vuoto e avviso">
        <h2>Vuoto e avviso (PAT-70, PAT-72)</h2>
        <EmptyState
          glyph={{ fam: "train", kind: "session" }}
          title="Nessuna scheda ancora"
          body="Salva una sessione come scheda, o creane una dagli esercizi."
          action={{ label: "Nuova scheda", href: "/kit" }}
        />
        <Banner
          text="Non salvato: la rete non risponde."
          onRetry={() => say("Salvato")}
        />
        <Banner
          tone="warn"
          text="3 voci da inviare: partono da sole quando torna la rete."
        />
      </section>

      <Confirm
        open={sheet === "conferma"}
        question="Unire «Run» in «Corsa»?"
        detail="Le 2 sessioni di Run passano a Corsa; «Run» resta come altro nome. Non si può annullare."
        verb="Unisci"
        onConfirm={() => {
          setSheet(null);
          say("Uniti");
        }}
        onCancel={() => setSheet(null)}
      />
      {toast}
    </>
  );
}
