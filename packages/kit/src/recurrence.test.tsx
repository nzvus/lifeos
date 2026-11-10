import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { formFields, readForm } from "./form";
import { readRecurrence, recurrenceText, startOf } from "./recurrence";

describe("«Ogni quanto», the recurrence field (PAT-61, PL-20)", () => {
  it("reads back the five kinds, in order, and refuses an incomplete one", () => {
    expect(readRecurrence('{"type":"daily"}')).toEqual({ type: "daily" });
    expect(readRecurrence('{"type":"weekdays","days":[5,1,3,1]}')).toEqual({
      type: "weekdays",
      days: [1, 3, 5],
    });
    expect(readRecurrence('{"type":"everyN","n":3,"start":"2026-11-10"}')).toEqual({
      type: "everyN",
      n: 3,
      start: "2026-11-10",
    });
    expect(readRecurrence('{"type":"timesPerWeek","n":3}')).toEqual({
      type: "timesPerWeek",
      n: 3,
    });
    expect(
      readRecurrence('{"type":"onDates","dates":["2026-11-15","2026-11-12"]}'),
    ).toEqual({ type: "onDates", dates: ["2026-11-12", "2026-11-15"] });
    for (const bad of [
      "",
      "ogni giorno",
      '{"type":"weekdays","days":[]}',
      '{"type":"weekdays","days":[8]}',
      '{"type":"everyN","n":0,"start":"2026-11-10"}',
      '{"type":"everyN","n":2}',
      '{"type":"timesPerWeek","n":8}',
      '{"type":"onDates","dates":["12/11"]}',
      '{"type":"monthly"}',
    ])
      expect(readRecurrence(bad), bad).toBeNull();
  });

  it("says each kind in his words", () => {
    expect(recurrenceText({ type: "daily" })).toBe("ogni giorno");
    expect(recurrenceText({ type: "weekdays", days: [1, 3, 5] })).toBe("lun, mer, ven");
    expect(recurrenceText({ type: "weekdays", days: [1, 2, 3, 4, 5, 6, 7] })).toBe(
      "ogni giorno",
    );
    expect(recurrenceText({ type: "everyN", n: 3, start: "2026-11-10" })).toBe(
      "ogni 3 giorni dal 10 nov",
    );
    expect(recurrenceText({ type: "timesPerWeek", n: 1 })).toBe("1 volta a settimana");
    expect(recurrenceText({ type: "onDates", dates: ["2026-11-12", "2026-11-15"] })).toBe(
      "il 12 nov, 15 nov",
    );
  });

  it("a new kind starts from a default; the same kind keeps what he set", () => {
    const keep = { type: "timesPerWeek", n: 5 } as const;
    expect(startOf("timesPerWeek", keep, "2026-11-10")).toBe(keep);
    expect(startOf("everyN", keep, "2026-11-10")).toEqual({
      type: "everyN",
      n: 2,
      start: "2026-11-10",
    });
    expect(startOf("weekdays", keep, "2026-11-10")).toEqual({
      type: "weekdays",
      days: [1, 2, 3, 4, 5],
    });
  });

  it("the form posts it as one JSON value, checked like every field", () => {
    const spec = [
      { key: "recurrence", label: "Ogni quanto", type: "recurrence" as const },
    ];
    const ok = readForm(spec, () => '{"type":"weekdays","days":[3,1]}');
    expect(ok).toEqual({
      values: { recurrence: '{"type":"weekdays","days":[1,3]}' },
      errors: {},
    });
    expect(readForm(spec, () => '{"type":"weekdays"}').errors).toEqual({
      recurrence: "Scegli ogni quanto",
    });
    const html = renderToStaticMarkup(
      <Field
        {...formFields(spec, { recurrence: '{"type":"weekdays","days":[1,3]}' })[0]!}
      />,
    );
    expect(html).toContain('name="recurrence"');
    expect(html).toMatch(/aria-label="lunedì" name="recurrence.day" checked=""/);
    expect(html).toContain("lun, mer");
    expect(html).toMatch(/aria-label="martedì" name="recurrence.day" value="2"/);
  });
});
