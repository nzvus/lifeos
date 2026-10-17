import { describe, expect, it } from "vitest";
import { kindRegistry, kindSchema } from "@/core/kinds";
import {
  clockToDayMin,
  entryForm,
  errorWords,
  kindRows,
  readEntryForm,
} from "./entry-form";

const reg = kindRegistry();

describe("the entry sheet from a kind", () => {
  it("makes each field a kit Field, with the day's words", () => {
    const f = entryForm(reg.get("weigh_in"));
    expect(f.title).toBe("Peso");
    expect(f.times).toEqual({ start: "Ora", end: null });
    expect(f.fields[0]).toEqual({
      name: "v.weightKg",
      label: "Peso",
      required: true,
      type: "stepper",
      unit: "kg",
      step: 0.1,
    });
    expect(f.fields.map((x) => x.name)).toEqual([
      "v.weightKg",
      "v.fasted",
      "v.afterToilet",
      "v.afterTraining",
    ]);
    expect(f.more.map((x) => x.label)).toEqual([
      "Massa grassa",
      "Vita",
      "Fianchi",
      "Collo",
      "Addome",
    ]);
    expect(f.fields.find((x) => x.name === "v.fasted")).toMatchObject({
      type: "choice",
      options: [
        { value: "true", label: "Sì" },
        { value: "false", label: "No" },
      ],
    });
  });

  it("asks a span for an interval, and skips what it cannot enter yet", () => {
    const sleep = entryForm(reg.get("sleep"));
    expect(sleep.times).toEqual({ start: "A letto", end: "Sveglia" });
    expect(sleep.fields.map((x) => x.name)).toEqual(["v.quality"]);
    const act = entryForm(reg.get("activity"));
    expect(act.fields.map((x) => x.name)).toEqual(["v.category", "v.focus"]);
    expect(act.fields[0]!.options![0]).toEqual({ value: "work", label: "Lavoro" });
  });

  it("names a user's own field in words", () => {
    const k = kindSchema.parse({
      key: "pushups",
      family: "train",
      domain: "training",
      shape: "instant",
      entry: "quick",
      fields: [{ key: "repsDone", type: "integer" }],
    });
    expect(entryForm(k)).toMatchObject({
      title: "Pushups",
      fields: [{ name: "v.repsDone", label: "Reps done", type: "stepper", step: 1 }],
    });
  });
});

describe("reading the posted sheet", () => {
  it("puts clock times before the boundary in the night after", () => {
    expect(clockToDayMin("07:30", 240)).toBe(450);
    expect(clockToDayMin("01:15", 240)).toBe(1515);
    expect(clockToDayMin("", 240)).toBeNull();
    expect(clockToDayMin("25:00", 240)).toBeNull();
  });

  it("starts a night's sleep the evening before; other spans end the morning after", () => {
    const sleep = readEntryForm(
      reg.get("sleep"),
      "2026-10-15",
      { start: "23:30", end: "07:00", "v.quality": "4", status: "done" },
      240,
    );
    expect(sleep).toEqual({
      day: "2026-10-15",
      status: "done",
      startMin: -30,
      endMin: 420,
      values: { quality: "4" },
      note: "",
    });
    const late = readEntryForm(
      reg.get("activity"),
      "2026-10-15",
      { start: "22:00", end: "03:30" },
      0,
    );
    expect([late.startMin, late.endMin]).toEqual([1320, 1650]);
  });

  it("drops an instant's end, reads a plan, and keeps the note", () => {
    const w = readEntryForm(
      reg.get("water"),
      "2026-10-15",
      { start: "10:00", end: "11:00", status: "planned", note: "x", "v.ml": "500" },
      240,
    );
    expect(w).toMatchObject({
      status: "planned",
      startMin: 600,
      endMin: null,
      note: "x",
    });
  });

  it("words core's errors by the form's names", () => {
    expect(errorWords({ ml: "required", start: "start_required" })).toEqual({
      "v.ml": "Serve un valore.",
      start: "Serve l’ora di inizio.",
    });
  });
});

describe("⊕'s kinds", () => {
  it("lists them as row Boxes with their family, drawing and sheet", () => {
    const rows = kindRows(
      [reg.get("water"), reg.get("activity")],
      (k) => "/aggiungi/" + k,
    );
    expect(rows).toEqual([
      {
        key: "water",
        href: "/aggiungi/water",
        entry: { fam: "drink", sub: "water", of: { kind: "water" }, title: "Acqua" },
      },
      {
        key: "activity",
        href: "/aggiungi/activity",
        entry: { fam: "habit", of: { kind: "activity" }, title: "Attività" },
      },
    ]);
  });
});
