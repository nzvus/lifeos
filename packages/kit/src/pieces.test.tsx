// The phase 3 pieces render what their pattern says (server markup: hooks run, effects don't).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Banner } from "./Banner";
import { Composer } from "./Composer";
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
