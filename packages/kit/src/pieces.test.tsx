// The phase 3 pieces render what their pattern says (server markup: hooks run, effects don't).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Banner } from "./Banner";
import { Box } from "./Box";
import { Criteria } from "./Criteria";
import { DayPart } from "./DayPart";
import { DateNav } from "./DateNav";
import { Nutrients } from "./Nutrients";
import { Composer } from "./Composer";
import { NavBar } from "./NavBar";
import { Timer } from "./Timer";
import { Confirm } from "./Confirm";
import { EmptyState } from "./EmptyState";
import { Elenco } from "./Elenco";
import { EntryHeader } from "./EntryHeader";
import { MergeSheet } from "./MergeSheet";
import { Find } from "./Find";
import { ObjectActions } from "./ObjectActions";
import { ObjectForm } from "./ObjectForm";
import { ObjectPage } from "./ObjectPage";
import { Sheet, SheetInline } from "./Sheet";
import { SortChips } from "./SortChips";
import { Toast } from "./Toast";
import { Unknown } from "./Unknown";
import { Why } from "./Why";

const html = (el: React.ReactElement) =>
  renderToStaticMarkup(<SheetInline.Provider value>{el}</SheetInline.Provider>);
const noop = () => {};
const order = (s: string, ...parts: string[]) =>
  parts.map((p) => s.indexOf(p)).every((i, k, a) => i >= 0 && (k === 0 || i > a[k - 1]!));

describe("Sheet (PAT-23)", () => {
  it("is nothing when closed; open, a named dialog with a dim area that closes it", () => {
    expect(html(<Sheet open={false} title="Altro" onClose={noop} />)).toBe("");
    const s = html(
      <Sheet open title="Panca piana" meta="Altro" onClose={noop} foot={<b>x</b>}>
        corpo
      </Sheet>,
    );
    expect(s).toContain('role="dialog"');
    expect(s).toContain('aria-label="Panca piana"');
    expect(s).toContain('class="k-dim" aria-label="Chiudi"');
    expect(order(s, "Panca piana", "corpo", "<b>x</b>")).toBe(true);
  });
});

describe("Composer (PAT-62, PAT-14)", () => {
  const line = {
    key: "f1",
    quantity: "80",
    unit: "g",
    step: 10,
    entry: { fam: "food", title: "Pasta", value: "286 kcal" },
  };
  const props = {
    candidates: [{ id: "f2", name: "Passata" }],
    hour: 13,
    findLabel: "Cerca un cibo",
    toLine: () => line,
    empty: "Cerca un cibo da aggiungere",
    saveLabel: "Salva il pasto",
    cancelHref: "/oggi",
    action: noop,
  };
  it("the lines with their stepper and «Togli», the search under them, the totals, «Annulla» + «Salva» at the foot", () => {
    const s = html(
      <Composer {...props} initial={[line]} totals={(ls) => <b>{ls.length} righe</b>} />,
    );
    expect(
      order(
        s,
        "Pasta",
        "Togli",
        'name="line.0.key"',
        'name="line.0"',
        "Cerca un cibo",
        "1 righe",
        "k-formfoot",
        "Annulla",
        "Salva il pasto",
      ),
    ).toBe(true);
  });
  it("with no line: says what to do, «Salva» is off", () => {
    const s = html(<Composer {...props} />);
    expect(s).toContain("Cerca un cibo da aggiungere");
    expect(s).toMatch(/<button type="submit"[^>]*disabled/);
  });
  it("PAT-62 the caller's lines and slots: head first, a titled section, a line's own part, its own search, «Salva» as it says", () => {
    const s = html(
      <Composer
        {...props}
        lines={[{ ...line, below: <i>MARCA</i> }]}
        onLines={noop}
        head={<h1>TESTA</h1>}
        title={{ label: "Ingredienti", node: "Ingredienti · 1" }}
        search={<p>RICERCA</p>}
        canSave={false}
      />,
    );
    expect(
      order(s, "TESTA", "Ingredienti · 1", "Pasta", 'name="line.0"', "MARCA", "RICERCA"),
    ).toBe(true);
    expect(s).not.toContain("Cerca un cibo"); // its own search replaces the plain one
    expect(s).toMatch(/<button type="submit"[^>]*disabled/);
    const empty = html(<Composer {...props} empty={<p>VUOTO</p>} canSave />);
    expect(empty).toContain("<p>VUOTO</p>");
    expect(empty).not.toMatch(/<button type="submit"[^>]*disabled/);
  });
});

describe("Composer, a fixed line (PAT-62)", () => {
  it("has no stepper: its quantity posts hidden, its «Togli» stays", () => {
    const s = html(
      <Composer
        initial={[
          {
            key: "kind:water",
            quantity: "1",
            unit: "",
            step: 1,
            fixed: true,
            entry: { fam: "habit", title: "Acqua" },
          },
        ]}
        candidates={[]}
        hour={9}
        findLabel="Cerca"
        empty="—"
        saveLabel="Salva"
        cancelHref="/oggi"
        action={noop}
      />,
    );
    expect(s).toContain('<input type="hidden" name="line.0" value="1"/>');
    expect(s).not.toContain("k-step");
    expect(s).toContain("Togli");
  });
});

describe("Composer without quantities (PAT-62)", () => {
  it("an ordered list: no stepper, «Su» from the second line, «Giù» until the last", () => {
    const l = (key: string, title: string) => ({
      key,
      quantity: "",
      unit: "",
      step: 1,
      entry: { fam: "train", title },
    });
    const s = html(
      <Composer
        counted={false}
        initial={[l("a", "Panca"), l("b", "Rematore")]}
        empty="Cerca un esercizio"
        saveLabel="Salva la scheda"
        cancelHref="/corpo"
        action={noop}
      />,
    );
    expect(s).not.toContain('name="line.0"');
    expect(s).toContain('name="line.1.key"');
    expect(s).toContain("Sposta giù Panca");
    expect(s).not.toContain("Sposta su Panca");
    expect(s).toContain("Sposta su Rematore");
    expect(s).not.toContain("Sposta giù Rematore");
  });
});

describe("Elenco (PAT-43, PAT-19, PAT-11)", () => {
  const sections = [
    {
      key: "route",
      title: "Tragitti",
      rows: [
        {
          id: "1",
          name: "Casa–palestra",
          meta: "in bici · 4,2 km",
          href: "/corpo/tragitto/1",
        },
      ],
      add: { label: "Nuovo tragitto", href: "/corpo/tragitto/nuovo" },
      empty: "Nessun tragitto",
    },
    { key: "routine", title: "Schede", rows: [], empty: "Nessuna scheda" },
  ];
  const filterHref = { active: "/corpo/elenco", archived: "/corpo/elenco?archiviati=1" };
  it("one section per type, rows that open the page, «+ Nuovo» last, the doppioni hint", () => {
    const s = html(
      <Elenco
        sections={sections}
        archived={false}
        filterHref={filterHref}
        twins={{ count: 2, href: "/corpo/elenco/doppioni" }}
      />,
    );
    expect(
      order(
        s,
        "Attivi",
        "Archiviati",
        "2 possibili doppioni",
        "Tragitti",
        "Casa–palestra",
        "Nuovo tragitto",
        "Schede",
        "Nessuna scheda",
      ),
    ).toBe(true);
    expect(s).toContain('href="/corpo/tragitto/1"');
    expect(s).toMatch(/class="k-chip on"[^>]*>Attivi/);
  });
  it("archived: the chip is on, no «+ Nuovo», no hint", () => {
    const s = html(
      <Elenco
        sections={sections}
        archived
        filterHref={filterHref}
        twins={{ count: 2, href: "/x" }}
      />,
    );
    expect(s).toMatch(/class="k-chip on"[^>]*>Archiviati/);
    expect(s).not.toContain("Nuovo tragitto");
    expect(s).not.toContain("doppioni");
  });
});

describe("MergeSheet (PAT-18)", () => {
  const items = [
    { id: "r", name: "Run", uses: 2 },
    { id: "j", name: "Jogging", uses: 1 },
  ];
  const props = {
    open: true,
    keep: "Corsa",
    candidates: items,
    hour: 18,
    findLabel: "Cerca un esercizio",
    preview: async () => ["2 sessioni passano a «Corsa»."],
    onConfirm: async () => null,
    onClose: noop,
  };
  it("first asks which one, with a search over the others", () => {
    const s = html(<MergeSheet {...props} />);
    expect(s).toContain("Unisci a «Corsa»");
    expect(s).toContain("Quale è la stessa cosa?");
    expect(s).toContain("Cerca un esercizio");
    expect(s).toContain("Run");
  });
  it("then says what moves, that it cannot be undone, «Unisci» last in tomato", () => {
    const s = html(
      <MergeSheet
        {...props}
        initial={{ other: items[0]!, lines: ["2 sessioni passano a «Corsa»."] }}
      />,
    );
    expect(s).toContain("«Run» in «Corsa»");
    expect(
      order(
        s,
        "2 sessioni passano",
        "Non si può annullare.",
        "Scegli un altro",
        "danger",
      ),
    ).toBe(true);
  });
});

describe("Confirm (PAT-73)", () => {
  it("asks in words, «Annulla» first, the destructive verb last in tomato", () => {
    const s = html(
      <Confirm
        open
        question="Unire Run in Corsa?"
        detail="2 sessioni passano a Corsa."
        verb="Unisci"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(s).toContain("Unire Run in Corsa?");
    expect(
      order(s, "2 sessioni", ">Annulla<", 'class="k-btn primary danger"', ">Unisci<"),
    ).toBe(true);
  });
});

describe("Toast (PAT-74, PAT-21)", () => {
  it("one status line above the NavBar; «Annulla» only when it can undo", () => {
    const t = html(
      <Toast
        toast={{ n: 1, text: "Archiviato", undoable: true }}
        onUndo={noop}
        onExpire={noop}
      />,
    );
    expect(t).toContain('class="k-toastbar"');
    expect(t).toContain('role="status"');
    expect(t).toContain(">Annulla<");
    expect(
      html(
        <Toast
          toast={{ n: 2, text: "Salvato", undoable: false }}
          onUndo={noop}
          onExpire={noop}
        />,
      ),
    ).not.toContain("Annulla");
    expect(html(<Toast toast={null} onUndo={noop} onExpire={noop} />)).toBe("");
  });
});

describe("EmptyState (PAT-70) and Banner (PAT-72)", () => {
  it("empty: glyph, what is missing, one action", () => {
    const s = html(
      <EmptyState
        glyph={{ fam: "train", kind: "session" }}
        title="Nessuna scheda"
        body="Salva una sessione come scheda, o creane una."
        action={{ label: "Nuova scheda", href: "/corpo/elenco" }}
      />,
    );
    expect(
      order(s, "k-glyph", "Nessuna scheda", "Salva una sessione", "Nuova scheda"),
    ).toBe(true);
    expect(s.match(/<a /g)).toHaveLength(1);
  });

  it("banner: an alert with «Riprova»", () => {
    const s = html(<Banner text="Non salvato: sei offline." onRetry={noop} />);
    expect(s).toContain('role="alert"');
    expect(s).toContain(">Riprova<");
  });
});

describe("Find (PAT-41) and SortChips (PAT-42)", () => {
  it("one text field (never type=search), results as whole-row buttons", () => {
    const s = html(
      <Find
        label="Cerca un esercizio"
        hour={18}
        items={[{ id: "1", name: "Panca piana", uses: 3, meta: "Petto" }]}
        filters={[{ key: "petto", label: "Petto" }]}
        onPick={noop}
      />,
    );
    expect(s).toContain('type="text"');
    expect(s).not.toContain('type="search"');
    expect(s).toContain('inputMode="search"');
    expect(s).toContain('class="k-findrow"');
    expect(s).toContain('aria-pressed="false"');
  });

  it("PAT-60 with an empty idle and nothing typed, no empty list under the field", () => {
    const s = html(
      <Find
        label="Cerca"
        hour={8}
        items={[{ id: "1", name: "Acqua" }]}
        idle={[]}
        onPick={noop}
      />,
    );
    expect(s).toContain('aria-label="Cerca"');
    expect(s).not.toContain("k-findrow");
    expect(s).not.toContain('role="list"');
  });

  it("sort keys as chips, the current one pressed", () => {
    const s = html(
      <SortChips
        keys={[
          { key: "use", label: "Più usati" },
          { key: "name", label: "Nome" },
        ]}
        value="name"
        onChange={noop}
      />,
    );
    expect(s).not.toContain("<select");
    expect(s).toMatch(/aria-pressed="true"[^>]*>Nome</);
  });
});

describe("ObjectActions (PAT-16, PAT-17, PAT-19) and ObjectPage (PAT-30)", () => {
  it("the everyday verbs in the row, the rest behind «Altro»", () => {
    const s = html(
      <ObjectActions
        title="Panca piana"
        verbs={["startFrom", "variant", "archive", "merge", "delete"]}
        onVerb={noop}
      />,
    );
    expect(
      order(s, ">Parti da…<", ">Variante<", ">Archivia<", 'aria-label="Altro"'),
    ).toBe(true);
    expect(s).not.toContain("Elimina"); // in the closed sheet
  });

  it("the page: header, values, parts, Andamento, Usato in, actions — in this order", () => {
    const s = html(
      <ObjectPage
        back={{ label: "Corpo", href: "/corpo/elenco" }}
        title="Panca piana"
        meta="Petto · 12 sessioni"
        values={<p>VALORI</p>}
        parts={[
          { title: "Varianti", node: <p>PARTI</p> },
          { title: "Marche", node: <p>MARCHE</p> },
        ]}
        progress={<p>CURVA</p>}
        usedIn={<p>SCHEDE</p>}
        actions={<p>AZIONI</p>}
      />,
    );
    expect(
      order(
        s,
        "Corpo",
        "Panca piana",
        "VALORI",
        "Varianti",
        "PARTI",
        "Marche",
        "MARCHE",
        "Andamento",
        "CURVA",
        "Usato in",
        "AZIONI",
      ),
    ).toBe(true);
  });
});

describe("EntryHeader (PAT-31)", () => {
  it("quanto · quando · ↺ only when the catalog object changed · ⋯", () => {
    const base = {
      amount: "× 1,5",
      when: { time: "13:05", status: "done" as const },
      onStep: noop,
      onMore: noop,
    };
    const s = html(<EntryHeader {...base} />);
    expect(
      order(
        s,
        'aria-label="Meno"',
        "× 1,5",
        'aria-label="Di più"',
        "13:05",
        "fatto",
        'aria-label="Altro"',
      ),
    ).toBe(true);
    expect(s).not.toContain("Aggiorna ai valori attuali");
    expect(html(<EntryHeader {...base} onRefresh={noop} />)).toContain(
      'aria-label="Aggiorna ai valori attuali"',
    );
  });
});

describe("ObjectForm (PAT-61, PAT-72)", () => {
  it("fields from the declaration, one «Salva», and the banner keeps what was typed", () => {
    const s = html(
      <ObjectForm
        fields={[
          { key: "distanceKm", label: "Distanza", type: "number", unit: "km" },
          { key: "mapsUrl", label: "Mappa", type: "text" },
        ]}
        values={{ distanceKm: 4.2, mapsUrl: "https://maps.example/x" }}
        error="Non salvato."
        onRetry={noop}
        action={noop}
      />,
    );
    expect(order(s, 'role="alert"', "Distanza", "Mappa", 'type="submit"')).toBe(true);
    expect(s).toContain('value="4,2"');
    expect(s).toContain("https://maps.example/x");
    expect(s.match(/type="submit"/g)).toHaveLength(1);
  });
});

describe("Why (PAT-51) and Unknown (PAT-55)", () => {
  it("a sheet waits for the mount and leaves the page's markup alone (no <div> inside a <p>)", () => {
    const s = renderToStaticMarkup(
      <p>
        <Why
          decl={{ title: "Proteine", formula: "somma", inputs: [], version: "v1" }}
          initiallyOpen
        >
          <span>81 g</span>
        </Why>
      </p>,
    );
    expect(s).not.toContain("k-sheet");
  });

  it("the number is the button that opens its «Perché?»", () => {
    const s = html(
      <Why
        decl={{ title: "Proteine di oggi", formula: "somma", inputs: [], version: "v1" }}
      >
        <span>132 g</span>
      </Why>,
    );
    expect(s).toMatch(
      /<button[^>]*class="k-why"[^>]*aria-label="Proteine di oggi: Perché\?"[^>]*><span>132 g<\/span>/,
    );
  });

  it("«non so» says what is missing", () => {
    expect(html(<Unknown missing={["la cena"]} />)).toContain(
      'non so</span><span class="k-meta">Manca: la cena',
    );
  });
});

describe("NavBar (PAT-01, PAT-60)", () => {
  const hrefs = {
    elenco: "/oggi/elenco",
    piano: "/oggi/piano",
    oggi: "/oggi",
    andamento: "/oggi/andamento",
    obiettivi: "/oggi/andamento/obiettivi",
  };
  it("the five places by action, Oggi in the middle, the open one ticked (ADR-0063)", () => {
    const bar = html(<NavBar active="piano" hrefs={hrefs} addHref="/aggiungi" />);
    expect(
      [...bar.matchAll(/class="k-place"[^>]*>.*?<\/svg><\/span>([^<]+)</g)].map(
        (m) => m[1],
      ),
    ).toEqual(["Elenco", "Piano", "Oggi", "Andamento", "Obiettivi"]);
    expect(bar).toMatch(/href="\/oggi\/piano" aria-current="page"/);
  });
  it("⊕ is a plain link, or the app's own link component when given", () => {
    expect(html(<NavBar active="elenco" hrefs={hrefs} addHref="/aggiungi" />)).toMatch(
      /<a class="k-add k-fab" href="\/aggiungi"/,
    );
    const Mine = ({ children, ...p }: { children: React.ReactNode; href: string }) => (
      <a data-mine="yes" {...p}>
        {children}
      </a>
    );
    expect(
      html(<NavBar active={null} hrefs={hrefs} addHref="/aggiungi" link={Mine} />),
    ).toContain('data-mine="yes"');
  });
});

describe("Timer (PAT-63)", () => {
  it("label, the clock with its length, the bar, the words; «Ferma» only while it runs by hand", () => {
    const s = html(
      <Timer
        phase={{ kind: "countdown", from: 0, seconds: 90 }}
        elapsed={30}
        tone="rest"
        label="Riposo"
        help="recupero 1:30"
        stop={{ label: "Ferma il tempo", onStop: noop }}
      />,
    );
    expect(
      order(
        s,
        "Riposo",
        "1:00",
        "di 1:30",
        'class="bar"',
        "recupero 1:30",
        "Ferma il tempo",
      ),
    ).toBe(true);
    const idle = html(
      <Timer
        phase={{ kind: "idle" }}
        elapsed={0}
        idle={null}
        tone="idle"
        label="Pronto"
        help=""
        stop={{ label: "Ferma", onStop: noop }}
      />,
    );
    expect(idle).toContain("–");
    expect(idle).not.toContain("Ferma");
  });
});

describe("Box with levels (VIS-40, «Oggi a livelli»)", () => {
  const entry = {
    fam: "food",
    title: "Pranzo",
    value: "445",
    meta: "Gnocchi alla sorrentina",
    strip: [
      { w: 20, c: "var(--macro-protein)" },
      { w: 30, c: "var(--macro-carbs)" },
    ],
    pills: [{ t: "a digiuno" }],
    score: {
      value: 25,
      parts: [{ name: "densità", score: 0.18, weight: 1 }],
      missing: [],
    },
  };
  const doors = [
    { key: "nutrients", label: "Nutrienti", panel: <p>tutti i nutrienti</p> },
    { key: "more", label: "Costo", value: "≈ 1,10 €" },
  ];
  const draw = (expanded: boolean, door: string | null = null) =>
    renderToStaticMarkup(
      <Box
        entry={entry}
        expanded={expanded}
        onToggle={() => {}}
        doors={doors}
        door={door}
        onDoor={() => {}}
        acts={[
          { label: "Fatto", onClick: () => {} },
          { label: "Salta", onClick: () => {} },
        ]}
      >
        <p>quattro barre</p>
      </Box>,
    );

  it("closed: the head, its strip and the line's actions, nothing else", () => {
    const h = draw(false);
    expect(h).toContain("k-lvstrip");
    expect(h).toContain("Fatto");
    expect(h).not.toContain("Gnocchi alla sorrentina");
    expect(h).not.toContain("quattro barre");
    expect(h).not.toContain("a digiuno");
    expect(h).not.toContain("k-door");
  });

  it("open: what the closed box said, then the doors with «Voto» first, no panel", () => {
    const h = draw(true);
    expect(h).not.toContain("k-lvstrip");
    expect(h).toContain("Gnocchi alla sorrentina");
    expect(h).toContain("quattro barre");
    expect(h.indexOf("Voto")).toBeLessThan(h.indexOf("Nutrienti"));
    expect(h).not.toContain("k-doorpanel");
    // A door with nothing behind it is a plain chip, not a button.
    expect(h).toMatch(/<span class="k-chip k-door static"><span>Costo<\/span>/);
  });

  it("one door open at a time: its panel only", () => {
    const h = draw(true, "voto");
    expect(h).toContain("k-doorpanel");
    expect(h).toContain("densità");
    expect(h).not.toContain("tutti i nutrienti");
    expect(draw(true, "nutrients")).toContain("tutti i nutrienti");
  });
});

describe("Nutrients in two halves, for a day's doors (VIS-40, VIS-50)", () => {
  const day = {
    kcal: { v: 1800, t: 2100 },
    macros: [{ key: "protein" as const, v: 120, t: 168 }],
    limits: [{ key: "salt" as const, v: 4, t: 5 }],
    micros: { summary: "6 su 11 coperti", groups: [] },
  };
  it("«main»: kcal and macros, no limits or vitamins; «rest» the other way round", () => {
    const main = renderToStaticMarkup(<Nutrients data={day} part="main" />);
    const rest = renderToStaticMarkup(<Nutrients data={day} part="rest" />);
    expect(main).toContain("Proteine");
    expect(main).not.toContain("Vitamine e minerali");
    expect(main).not.toContain("k-nlims");
    expect(rest).toContain("Vitamine e minerali");
    expect(rest).toContain("k-nlims");
    expect(rest).not.toContain("Proteine");
  });
});

describe("DayPart that closes (VIS-61, «Oggi a livelli» step 4)", () => {
  const draw = (open: boolean) =>
    renderToStaticMarkup(
      <DayPart
        name="Pomeriggio"
        when="dalle 15:00"
        open={open}
        onToggle={() => {}}
        summary="2 voci · 1.677 kcal"
        icons={[{ fam: "food" }]}
      />,
    );
  it("closed: a button that says how many voci and kcal, with their icons", () => {
    const h = draw(false);
    expect(h).toMatch(/^<button[^>]*aria-expanded="false"/);
    expect(h).toContain('<span class="cnt">2 voci · </span>1.677 kcal');
    expect(h).toContain('class="ics"');
    expect(h).not.toContain("dalle 15:00</span>");
  });
  it("open: its hour again, no icons; without a toggle it stays a separator", () => {
    const h = draw(true);
    expect(h).toContain('aria-expanded="true"');
    expect(h).toContain("dalle 15:00");
    expect(h).not.toContain('class="ics"');
    expect(renderToStaticMarkup(<DayPart name="Sera" when="dalle 18:30" />)).toContain(
      'role="separator"',
    );
  });
});

describe("DateNav: every day opens in Oggi, a day to come too (PAT-97)", () => {
  it("days before, today and after all link to their own Oggi page, never to Piano", () => {
    const h = renderToStaticMarkup(
      <DateNav day="2026-11-14" today="2026-11-14" hrefBase="/oggi/" />,
    );
    expect(h).toContain('href="/oggi/2026-11-13"');
    expect(h).toContain('href="/oggi/2026-11-15"');
    expect(h).not.toContain("piano");
  });
});

describe("ObjectPage with `first` and `fold` (PAT-30, a ciclo's page)", () => {
  it("first under the header, the parts, then the values folded under their word", () => {
    const h = renderToStaticMarkup(
      <ObjectPage
        back={{ label: "Oggi", href: "/oggi" }}
        title="PPLCR"
        values={<p>avanza a ogni sessione</p>}
        parts={[{ title: "Passi", node: <p>Push, Pull, Legs</p> }]}
        actions={null}
        first={<p>Questa volta</p>}
        fold="Regole"
      />,
    );
    const at = (t: string) => h.indexOf(t);
    expect(at("Questa volta")).toBeLessThan(at("Push, Pull, Legs"));
    expect(at("Push, Pull, Legs")).toBeLessThan(at("<summary>Regole</summary>"));
    expect(at("<summary>Regole</summary>")).toBeLessThan(at("avanza a ogni sessione"));
  });
});

describe("Box taps: the whole box, no side arrow (VIS-40; his 19 Nov)", () => {
  const entry = { fam: "food", title: "Pranzo", value: "445", href: "/voce/1" };
  const act = { label: "+1", onClick: () => {} };
  it("a box that only leads somewhere is one link, even with an action", () => {
    const html = renderToStaticMarkup(<Box entry={entry} acts={[act]} />);
    expect(html).toContain('class="k-head k-cover"');
    expect(html).not.toContain("›");
  });
  it("a box that opens has no arrow; open, its page is «Apri» inside it", () => {
    const shut = renderToStaticMarkup(
      <Box entry={entry} expanded={false} onToggle={() => {}} doors={[]} />,
    );
    expect(shut).not.toContain("›");
    expect(shut).not.toContain("Apri");
    const open = renderToStaticMarkup(
      <Box entry={entry} expanded onToggle={() => {}} doors={[]} />,
    );
    expect(open).toContain('href="/voce/1"');
    expect(open).toContain(">Apri</a>");
  });
});

describe("a voto open: one line per criterion, why some do not count, its page (VIS-43, PAT-51)", () => {
  const entry = {
    fam: "food",
    title: "Cena",
    value: "380",
    score: {
      value: 64,
      parts: [
        { name: "densità di nutrienti", score: 0.5, weight: 0.6 },
        { name: "limiti", score: 0.8, weight: 0.4 },
      ],
      missing: ["valore (manca il prezzo)"],
      how: "/oggi/andamento/come-valutiamo?modello=food",
    },
  };
  const html = renderToStaticMarkup(
    <Box
      entry={entry}
      expanded
      onToggle={() => {}}
      doors={[]}
      door="voto"
      onDoor={() => {}}
    />,
  );
  it("each criterion is one row: mark, name and weight, ruler, number", () => {
    expect(html.match(/class="k-crit"/g)).toHaveLength(2);
    expect(html).toContain("pesa 60 %");
  });
  it("says what does not count and why, after the criteria, and links its page", () => {
    expect(html).toContain("Non contano: valore (manca il prezzo)");
    expect(html).not.toContain("senza:");
    expect(html.indexOf("Non contano")).toBeGreaterThan(html.lastIndexOf("k-crit"));
    expect(html).toContain('href="/oggi/andamento/come-valutiamo?modello=food"');
    expect(html).toContain("Come valutiamo ›");
  });
});

describe("Criteria: the opened voto, three proposals (VIS-43; his 19 Nov)", () => {
  const data = {
    value: 71,
    parts: [
      { name: "densità di nutrienti", score: 0.26, weight: 0.39 },
      { name: "limiti", score: 1, weight: 0.61 },
    ],
    missing: ["valore (manca il prezzo)"],
    how: "/oggi/andamento/come-valutiamo?modello=food",
  };
  for (const look of ["inbar", "columns", "points"] as const) {
    it(
      look +
        ": every criterion with its mark and number, why some do not count, its page",
      () => {
        const h = renderToStaticMarkup(<Criteria data={data} look={look} />);
        expect(h).toContain("densità di nutrienti");
        expect(h).toContain("limiti");
        expect(
          h.match(/k-st /g)?.length ?? h.match(/role="img"/g)?.length,
        ).toBeGreaterThan(0);
        expect(h).toContain("Non contano: valore (manca il prezzo)");
        expect(h).toContain('href="/oggi/andamento/come-valutiamo?modello=food"');
      },
    );
  }
  it("points: the costliest first, with what it lost", () => {
    const h = renderToStaticMarkup(<Criteria data={data} look="points" />);
    expect(h.indexOf("densità di nutrienti")).toBeLessThan(h.indexOf("limiti"));
    expect(h).toContain("−29");
  });
});
