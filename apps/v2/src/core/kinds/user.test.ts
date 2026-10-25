import { describe, expect, it } from "vitest";
import { kindRegistry } from "./registry";
import { buildUserKind, fieldKey, kindKey } from "./user";

describe("«Nuovo tracker»: the person's own kind", () => {
  it("makes keys from the words", () => {
    expect(kindKey("Mal di testa")).toBe("mal_di_testa");
    expect(kindKey("3 cose belle")).toBe("t_3_cose_belle");
    expect(fieldKey("Intensità")).toBe("intensita");
    expect(fieldKey("Ore di schermo")).toBe("oreDiSchermo");
  });

  it("builds a kind the registry reads as one of its own, with the person's words", () => {
    const taken = new Set(["mal_di_testa"]);
    const r = buildUserKind(
      {
        name: " Mal di  testa ",
        family: "body",
        shape: "interval",
        fields: [
          { label: "Intensità", type: "scale" },
          {
            label: "Farmaco",
            type: "choice",
            choices: "nessuno, ibuprofene, paracetamolo",
          },
          { label: "Acqua bevuta", type: "number", unit: "ml" },
        ],
      },
      taken,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.row).toMatchObject({
      key: "mal_di_testa_2",
      name: "Mal di testa",
      domain: "body",
      shape: "interval",
      entryMode: "form",
    });
    const k = kindRegistry([{ ...r.row, archivedAt: null }]).get("mal_di_testa_2");
    expect(k.name).toBe("Mal di testa");
    expect(k.fields.map((f) => [f.key, f.label, f.type])).toEqual([
      ["intensita", "Intensità", "scale"],
      ["farmaco", "Farmaco", "choice"],
      ["acquaBevuta", "Acqua bevuta", "number"],
    ]);
  });

  it("says what is wrong", () => {
    const r = buildUserKind(
      {
        name: "x",
        family: "money",
        shape: "sometimes",
        fields: [
          { label: "", type: "number" },
          { label: "Tipo", type: "choice", choices: "uno" },
          { label: "tipo", type: "text" },
        ],
      },
      new Set(),
    );
    expect(r).toEqual({
      ok: false,
      errors: [
        "name",
        "family",
        "shape",
        { field: 0, error: "label" },
        { field: 1, error: "choices" },
        { field: 2, error: "same" },
      ],
    });
  });
});
