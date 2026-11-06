import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Capture, captureIdle, type CaptureItem } from "./Capture";
import { SheetInline } from "./Sheet";

const types: CaptureItem[] = [
  { id: "peso", name: "Peso", area: "Corpo", uses: 40, href: "/aggiungi/peso" },
  { id: "pasto", name: "Pasto", area: "Cibo", uses: 90, href: "/aggiungi/pasto" },
  { id: "acqua", name: "Acqua", area: "Cibo", uses: 10, href: "/aggiungi/acqua" },
  { id: "spesa", name: "Spesa", area: "Soldi", href: "/aggiungi/spesa" },
];
const objects: CaptureItem[] = [
  {
    id: "caffe",
    name: "Caffè",
    meta: "cibo",
    uses: 300,
    href: "/aggiungi/pasto?cibo=caffe",
  },
];

describe("Capture (PAT-60, PAT-10)", () => {
  it("with nothing typed lists the types, the current area's first, then by use", () => {
    expect(captureIdle(types, "Cibo").map((t) => t.id)).toEqual([
      "pasto",
      "acqua",
      "peso",
      "spesa",
    ]);
    expect(captureIdle(types, null).map((t) => t.id)).toEqual([
      "pasto",
      "peso",
      "acqua",
      "spesa",
    ]);
  });

  it("is one search: the types at rest, never the objects until he types", () => {
    const s = renderToStaticMarkup(
      <SheetInline.Provider value>
        <Capture
          open
          area="Cibo"
          types={types}
          objects={objects}
          hour={8}
          onPick={() => {}}
          onClose={() => {}}
        />
      </SheetInline.Provider>,
    );
    expect(s).toContain("Aggiungi");
    expect(s).toContain("Cosa aggiungi?");
    expect(s.indexOf("Pasto")).toBeLessThan(s.indexOf("Peso"));
    expect(s).not.toContain("Caffè");
  });
});
