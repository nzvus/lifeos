/**
 * core/account/csv.ts — one kind's entries as a spreadsheet (ADR-0052 C:
 * export only): a row per entry with its fields as columns, a meal a row
 * per food with its nutrients in the amount eaten. Semicolons and decimal
 * commas, as an Italian spreadsheet opens them, and a BOM so accents read
 * right. `toCsv` is pure; `readKindTable` reads the owner's live entries.
 */
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries, entryLines, entryLineValues, entryValues } from "../db/schema";
import { localParts } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

const cell = (v: string) => (/[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
const decimal = (v: string) => (/^-?\d+(\.\d+)?$/.test(v) ? v.replace(".", ",") : v);

/** Pure: the header and the rows as CSV text (semicolons, decimal commas, a BOM). */
export function toCsv(
  header: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const line = (r: readonly string[]) => r.map((v) => cell(decimal(v))).join(";");
  return "﻿" + [line(header), ...rows.map(line)].join("\r\n") + "\r\n";
}

const MEAL_NUTRIENTS = [
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fibre",
  "salt",
];
const trim = (n: number) => String(Math.round(n * 100) / 100);

/** The owner's live entries of a kind as a table; times in the person's zone. */
export async function readKindTable(
  db: Db,
  owner: Owner,
  kind: string,
  timeZone: string,
): Promise<{ header: string[]; rows: string[][] }> {
  const es = await db
    .select({
      id: entries.id,
      day: entries.day,
      startAt: entries.startAt,
      endAt: entries.endAt,
      status: entries.status,
      note: entries.note,
    })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, kind),
        isNull(entries.deletedAt),
        isNull(entries.parentId),
      ),
    )
    .orderBy(asc(entries.day), asc(entries.startAt));
  const ids = es.map((e) => e.id);
  const time = (d: Date | null) => {
    if (!d) return "";
    const m = localParts(d, timeZone).minute;
    return (
      String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0")
    );
  };
  const vals = ids.length
    ? await db
        .select({
          entryId: entryValues.entryId,
          field: entryValues.field,
          num: entryValues.num,
          text: entryValues.text,
          bool: entryValues.bool,
        })
        .from(entryValues)
        .where(and(ownedBy(entryValues, owner), inArray(entryValues.entryId, ids)))
    : [];
  const byEntry = new Map<string, Record<string, string>>();
  for (const v of vals) {
    const s =
      v.num !== null
        ? String(Number(v.num))
        : (v.text ?? (v.bool === null ? null : v.bool ? "sì" : "no"));
    if (s !== null)
      byEntry.set(v.entryId, { ...byEntry.get(v.entryId), [v.field]: String(s) });
  }
  const fields = [...new Set(vals.map((v) => v.field))].sort();
  const base = (e: (typeof es)[number]) => [
    e.day,
    time(e.startAt),
    time(e.endAt),
    e.status,
  ];
  if (kind !== "meal") {
    return {
      header: ["giorno", "inizio", "fine", "stato", ...fields, "nota"],
      rows: es.map((e) => [
        ...base(e),
        ...fields.map((f) => byEntry.get(e.id)?.[f] ?? ""),
        e.note,
      ]),
    };
  }
  // A meal: a row per food, its nutrients in the amount eaten (servings applied).
  const lines = ids.length
    ? await db
        .select({
          id: entryLines.id,
          entryId: entryLines.entryId,
          name: entryLines.name,
          quantity: entryLines.quantity,
          unit: entryLines.unit,
        })
        .from(entryLines)
        .where(and(ownedBy(entryLines, owner), inArray(entryLines.entryId, ids)))
        .orderBy(asc(entryLines.position))
    : [];
  const lv = lines.length
    ? await db
        .select({
          lineId: entryLineValues.lineId,
          field: entryLineValues.field,
          num: entryLineValues.num,
        })
        .from(entryLineValues)
        .where(
          and(
            ownedBy(entryLineValues, owner),
            inArray(
              entryLineValues.lineId,
              lines.map((l) => l.id),
            ),
            inArray(entryLineValues.field, MEAL_NUTRIENTS),
          ),
        )
    : [];
  const per = new Map<string, Record<string, number>>();
  for (const v of lv)
    per.set(v.lineId, { ...per.get(v.lineId), [v.field]: Number(v.num) });
  const rows: string[][] = [];
  for (const e of es) {
    const own = byEntry.get(e.id) ?? {};
    const times = Number(own["servings"] ?? "1") || 1;
    for (const l of lines.filter((x) => x.entryId === e.id)) {
      const q = Number(l.quantity) * times;
      rows.push([
        ...base(e),
        own["role"] ?? "",
        l.name,
        trim(q),
        l.unit,
        ...MEAL_NUTRIENTS.map((f) => {
          const v = per.get(l.id)?.[f];
          return v === undefined ? "" : trim((v * q) / 100);
        }),
        e.note,
      ]);
    }
  }
  return {
    header: [
      "giorno",
      "inizio",
      "fine",
      "stato",
      "pasto",
      "cibo",
      "quantità",
      "unità",
      ...MEAL_NUTRIENTS,
      "nota",
    ],
    rows,
  };
}
