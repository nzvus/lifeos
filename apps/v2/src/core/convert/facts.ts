/**
 * The converter's facts (migration.md "Mapping"): everything that happened
 * or was planned becomes an entry of its kind, with its values; meals and
 * batches keep their lines and the snapshot exactly (ADR-0007); training
 * sets and money keep their own shapes. v1 ids are kept, so every v2 entry
 * traces back to its v1 row.
 */
import type { CatalogMaps } from "./catalog";
import { NUTRIENTS } from "./catalog";
import type { Out, V1Export, V1Row } from "./context";
import { bool, confidenceOf, dec, idFor, intOf, iso, num, str, text } from "./context";

const rows = (v1: V1Export, t: string): V1Row[] => v1.tables[t] ?? [];
const S = (x: unknown) => String(x);

type Status = "planned" | "done" | "skipped";
const STATUS: Record<string, Status> = {
  planned: "planned",
  eaten: "done",
  done: "done",
  skipped: "skipped",
};

type EntryRow = {
  id: string;
  kind: string;
  day: string;
  status: Status;
  startAt?: string | null;
  endAt?: string | null;
  parentId?: string | null;
  itemId?: string | null;
  source?: "typed" | "import" | "derived" | "timer";
  confidence?: string;
  note?: string | null;
  createdAt?: string | null;
  deletedAt?: string | null;
};
type EntryFn = (row: EntryRow) => void;

export function convertFacts(v1: V1Export, out: Out, maps: CatalogMaps): void {
  const today = v1.exportedAt.slice(0, 10);
  const entry: EntryFn = (row) =>
    out.push("entries", {
      id: row.id,
      kind: row.kind,
      day: row.day,
      status: row.status,
      startAt: row.startAt ?? null,
      endAt: row.endAt ?? null,
      parentId: row.parentId ?? null,
      itemId: row.itemId ?? null,
      source: row.source ?? "import",
      confidence: row.confidence ?? "1",
      note: row.note ?? "",
      deletedAt: row.deletedAt ?? null,
      ...(row.createdAt ? { createdAt: row.createdAt } : {}),
    });

  /** A line with its snapshot: the item's values per 100 at logging, exactly as v1 kept them. */
  const line = (
    entryId: string,
    l: V1Row,
    ptr: { food: string; product?: string | null; format?: string | null } | undefined,
  ) => {
    const landed =
      ptr ?? (l["ingredientId"] ? maps.ingredient.get(S(l["ingredientId"])) : undefined);
    const id = S(l["id"]);
    out.push("entry_lines", {
      id,
      entryId,
      position: Number(l["position"] ?? 0),
      itemId: landed?.food ?? null,
      productId: landed?.product ?? null,
      formatId: landed?.format ?? null,
      name: S(l["name"] ?? ""),
      quantity: dec(l["quantity"]) ?? "0",
      unit: S(l["unit"] ?? "g"),
    });
    for (const [c, f] of NUTRIENTS) {
      const v = dec(l[c]);
      if (v !== null) out.push("entry_line_values", { lineId: id, field: f, num: v });
    }
    for (const [c, f] of [
      ["nova", "nova"],
      ["packagePriceCents", "packagePriceCents"],
      ["packageSize", "packageSize"],
    ] as const) {
      const v = dec(l[c]);
      if (v !== null) out.push("entry_line_values", { lineId: id, field: f, num: v });
    }
  };

  // Meals.
  const leftOut = new Set(rows(v1, "log_entry_left_out").map((r) => S(r["entryId"])));
  const mealPtr = v1._v2?.pointers.log_entries ?? {};
  const itemPtr = v1._v2?.pointers.log_entry_items ?? {};
  const items = new Map<string, V1Row[]>();
  for (const i of rows(v1, "log_entry_items"))
    items.set(S(i["entryId"]), [...(items.get(S(i["entryId"])) ?? []), i]);
  for (const e of rows(v1, "log_entries")) {
    const id = S(e["id"]);
    const meal = e["mealId"]
      ? (mealPtr[id] ?? maps.meal.get(S(e["mealId"])) ?? null)
      : null;
    entry({
      id,
      kind: "meal",
      day: S(e["day"]),
      status: STATUS[S(e["status"])] ?? "done",
      startAt: iso(e["at"]),
      itemId: meal,
      confidence: e["estimated"] === true ? "0.60" : "1",
      createdAt: iso(e["createdAt"]),
      deletedAt: iso(e["deletedAt"]),
    });
    out.entryValue(id, "role", text(e["moment"]));
    out.entryValue(id, "servings", num(e["servings"]));
    out.entryValue(id, "label", text(e["label"]));
    out.entryValue(id, "estimated", bool(e["estimated"]));
    if (leftOut.has(id)) out.entryValue(id, "leftOut", { bool: true });
    if (e["batchId"])
      out.push("entry_links", { fromId: id, toId: S(e["batchId"]), relation: "related" });
    for (const l of items.get(id) ?? []) line(id, l, itemPtr[S(l["id"])]);
  }

  // Batches cooked ahead: an entry with its lines; portions as a value.
  const batchPtr = v1._v2?.pointers.batch_lines ?? {};
  for (const b of rows(v1, "batches")) {
    const id = S(b["id"]);
    entry({
      id,
      kind: "batch",
      day: S(b["day"]),
      status: "done",
      startAt: iso(b["cookedAt"]),
      itemId: b["mealId"] ? (maps.meal.get(S(b["mealId"])) ?? null) : null,
      note: str(b["notes"]),
      createdAt: iso(b["createdAt"]),
      deletedAt: iso(b["deletedAt"]),
    });
    out.entryValue(id, "portions", num(b["portions"]));
    out.entryValue(id, "label", text(b["label"]));
  }
  for (const l of rows(v1, "batch_lines")) line(S(l["batchId"]), l, batchPtr[S(l["id"])]);

  // Body: a weigh-in (or measurements without a weight), with its context.
  const context = new Map(
    rows(v1, "weigh_in_context").map((c) => [S(c["measurementId"]), c]),
  );
  for (const m of rows(v1, "body_measurements")) {
    const id = S(m["id"]);
    const c = context.get(id);
    entry({
      id,
      kind:
        m["weightKg"] !== null && m["weightKg"] !== undefined
          ? "weigh_in"
          : "measurements",
      day: S(m["day"]),
      status: "done",
      startAt: iso(c?.["measuredAt"]),
      note: str(m["notes"]),
      createdAt: iso(m["createdAt"]),
      deletedAt: iso(m["deletedAt"]),
    });
    for (const [col, f] of [
      ["weightKg", "weightKg"],
      ["bodyFatPct", "bodyFatPct"],
      ["waistCm", "waistCm"],
      ["hipCm", "hipCm"],
      ["neckCm", "neckCm"],
      ["abdomenCm", "abdomenCm"],
    ] as const)
      out.entryValue(id, f, num(m[col]));
    for (const f of ["fasted", "afterToilet", "afterTraining"] as const)
      out.entryValue(id, f, bool(c?.[f]));
  }

  // Steps and the day's level (time on one's feet, E4a).
  const stepEstimates = v1._estimates?.day_activity ?? {};
  for (const a of rows(v1, "day_activity")) {
    const d = S(a["day"]);
    const id = idFor("day_activity", d);
    const est =
      a["steps"] === null || a["steps"] === undefined ? stepEstimates[d] : undefined;
    entry({
      id,
      kind: "steps",
      day: d,
      status: d < today ? "done" : "planned",
      ...(est
        ? { source: "derived" as const, confidence: confidenceOf(est.provenance) }
        : {}),
      note: est ? `stima: ${est.provenance?.source ?? ""}` : null,
    });
    out.entryValue(id, "steps", num(a["steps"] ?? est?.steps));
    if (est?.steps !== undefined) out.estimates++;
    out.entryValue(id, "walkingMin", num(a["walkingMin"]));
    out.entryValue(id, "level", text(a["level"]));
  }

  // Sleep: an interval from bed to wake, on the day it ends.
  for (const s of rows(v1, "sleep_logs")) {
    const d = S(s["day"]);
    const id = idFor("sleep_logs", d);
    const bed = iso(s["bedAt"]);
    const wake = iso(s["wakeAt"]);
    const ok = bed !== null && wake !== null && wake > bed;
    if (bed && wake && !ok)
      out.notes.push(`sleep of ${d}: bed after wake, kept as two values`);
    entry({
      id,
      kind: "sleep",
      day: d,
      status: "done",
      startAt: ok ? bed : null,
      endAt: ok ? wake : null,
      note: str(s["notes"]),
      createdAt: iso(s["createdAt"]),
    });
    out.entryValue(id, "quality", num(s["quality"]));
    if (!ok) {
      out.entryValue(id, "bedAt", text(bed));
      out.entryValue(id, "wakeAt", text(wake));
    }
  }

  // The day's check-in (moment unknown); its note becomes a journal entry.
  for (const c of rows(v1, "day_checkins")) {
    const d = S(c["day"]);
    const id = idFor("day_checkins", d);
    entry({ id, kind: "checkin", day: d, status: "done" });
    for (const f of ["mood", "energy", "stress"] as const)
      out.entryValue(id, f, num(c[f]));
    if (str(c["note"]))
      entry({
        id: idFor("journal", d),
        kind: "journal",
        day: d,
        status: "done",
        note: str(c["note"]),
      });
  }

  convertTrainingFacts(v1, out, entry);
  convertPantryAndMoney(v1, out, maps, entry);
}

function convertTrainingFacts(v1: V1Export, out: Out, entry: EntryFn) {
  const status = new Map<string, Status>();
  for (const t of rows(v1, "training_sessions")) {
    const id = S(t["id"]);
    const st = STATUS[S(t["status"])] ?? "done";
    status.set(id, st);
    const start = iso(t["startedAt"]);
    const minutes = intOf(t["durationMin"]);
    entry({
      id,
      kind: "session",
      day: S(t["day"]),
      status: st,
      startAt: start,
      endAt:
        start && minutes && minutes > 0
          ? new Date(Date.parse(start) + minutes * 60_000).toISOString()
          : null,
      itemId: str(t["routineId"]),
      note: str(t["notes"]),
      createdAt: iso(t["createdAt"]),
      deletedAt: iso(t["deletedAt"]),
    });
    out.entryValue(id, "durationMin", num(t["durationMin"]));
    out.entryValue(id, "intensity", text(t["intensity"]));
    out.entryValue(id, "kcalEstimate", num(t["kcalEstimate"]));
    out.entryValue(id, "label", text(t["label"]));
    const groups = Array.isArray(t["muscleGroups"])
      ? (t["muscleGroups"] as string[])
      : [];
    out.entryValue(id, "muscleGroups", text(groups.join(",")));
  }
  const day = new Map(
    rows(v1, "training_sessions").map((t) => [S(t["id"]), S(t["day"])]),
  );
  for (const x of rows(v1, "session_exercises")) {
    const id = S(x["id"]);
    const session = S(x["sessionId"]);
    entry({
      id,
      kind: "session_exercise",
      day: day.get(session) ?? v1.exportedAt.slice(0, 10),
      status: status.get(session) ?? "done",
      parentId: session,
      itemId: str(x["exerciseId"]),
      note: str(x["notes"]),
    });
    out.entryValue(id, "position", num(x["position"]));
    out.entryValue(id, "restS", num(x["restS"]));
  }
  let restDropped = 0;
  for (const s of rows(v1, "sets")) {
    if (s["restS"] !== null && s["restS"] !== undefined) restDropped++;
    out.push("training_sets", {
      id: S(s["id"]),
      entryId: S(s["sessionExerciseId"]),
      position: Number(s["position"] ?? 0),
      reps: intOf(s["reps"]),
      loadKg: dec(s["loadKg"]),
      loadEntry: "total",
      rir: intOf(s["rir"]),
      durationS: intOf(s["durationS"]),
      distanceM: dec(s["distanceM"]),
      speedKmh: dec(s["speedKmh"]),
      inclinePct: dec(s["inclinePct"]),
      loadText: str(s["loadText"]),
      loadApprox: s["loadApprox"] === true,
      warmup: s["warmup"] === true,
      startedAt: iso(s["startedAt"]),
      endedAt: iso(s["endedAt"]),
      done: s["done"] === true,
    });
  }
  out.drop(
    "sets.restS",
    restDropped,
    "a set's rest is derived from the times between sets (migration.md)",
  );
}

function convertPantryAndMoney(
  v1: V1Export,
  out: Out,
  maps: CatalogMaps,
  entry: EntryFn,
) {
  for (const p of rows(v1, "purchases")) {
    const id = S(p["id"]);
    const format = maps.pantryFormat.get(S(p["productId"])) ?? null;
    entry({
      id,
      kind: "purchase",
      day: S(p["day"]),
      status: "done",
      itemId: format,
      createdAt: iso(p["createdAt"]),
      deletedAt: iso(p["deletedAt"]),
    });
    out.entryValue(id, "packages", num(p["packages"]));
    out.entryValue(id, "priceCents", num(p["priceCents"]));
    out.entryValue(id, "shop", text(p["shop"]));
  }
  for (const c of rows(v1, "stock_counts")) {
    const id = S(c["id"]);
    const item = c["productId"]
      ? (maps.pantryFormat.get(S(c["productId"])) ?? null)
      : (maps.ingredient.get(S(c["ingredientId"]))?.food ?? null);
    const at = iso(c["at"]);
    entry({
      id,
      kind: "stock_count",
      day: (at ?? v1.exportedAt).slice(0, 10),
      status: "done",
      startAt: at,
      itemId: item,
      createdAt: iso(c["createdAt"]),
    });
    out.entryValue(id, "quantity", num(c["quantity"]));
  }
  for (const r of rows(v1, "money_receipts"))
    out.push("receipts", {
      id: S(r["id"]),
      day: S(r["day"]),
      shop: S(r["shop"] ?? ""),
      text: S(r["text"] ?? ""),
      deletedAt: iso(r["deletedAt"]),
      ...(iso(r["createdAt"]) ? { createdAt: iso(r["createdAt"])! } : {}),
    });
  for (const m of rows(v1, "money_movements")) {
    const id = S(m["id"]);
    entry({
      id,
      kind: "movement",
      day: S(m["day"]),
      status: "done",
      note: str(m["description"]),
      createdAt: iso(m["createdAt"]),
      deletedAt: iso(m["deletedAt"]),
    });
    const tags = Array.isArray(m["tags"]) ? (m["tags"] as string[]) : [];
    out.entryValue(id, "tags", text(tags.join(",")));
    out.push("money_movements", {
      entryId: id,
      accountId: null,
      amountCents: Number(m["amountCents"]),
      categoryId: str(m["categoryId"]),
      shop: S(m["shop"] ?? ""),
      method: str(m["method"]),
      receiptId: str(m["receiptId"]),
    });
  }
  for (const l of rows(v1, "money_lines"))
    out.push("money_lines", {
      id: S(l["id"]),
      movementId: S(l["movementId"]),
      position: Number(l["position"] ?? 0),
      description: S(l["description"] ?? ""),
      quantity: dec(l["quantity"]),
      amountCents: Number(l["amountCents"]),
      productId: l["productId"]
        ? (maps.pantryFormat.get(S(l["productId"])) ?? null)
        : null,
      purchaseEntryId: str(l["purchaseId"]),
    });
  for (const a of rows(v1, "receipt_aliases")) {
    const format = maps.pantryFormat.get(S(a["productId"]));
    if (!format) {
      out.drop("receipt_aliases", 1, "its product is not in the export");
      continue;
    }
    out.push("receipt_aliases", {
      id: S(a["id"]),
      key: S(a["key"]),
      productId: format,
      ...(iso(a["createdAt"]) ? { createdAt: iso(a["createdAt"])! } : {}),
    });
  }
}
