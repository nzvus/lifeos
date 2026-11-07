import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { buildUserKind, createUserKind } from "../kinds/user";
import { act, listObjects, readObject, undo, type VerbResult } from "./index";

const ok = (r: VerbResult) => {
  if (!r.ok) throw new Error(`refused: ${r.refused} ${r.detail ?? ""}`);
  return r;
};

describe("core/verbs: one function per verb (PAT-24, MOD-20)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  const item = async (id: string) =>
    (await db.select().from(s.catalogItems).where(eq(s.catalogItems.id, id)))[0]!;
  const values = async (id: string) =>
    Object.fromEntries(
      (await db.select().from(s.catalogValues).where(eq(s.catalogValues.itemId, id))).map(
        (v) => [v.field, v.num !== null ? Number(v.num) : (v.text ?? v.bool)],
      ),
    );

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
  });
  afterAll(() => close());

  it("create validates against the type's fields, and its undo deletes it", async () => {
    expect(
      await act(db, a, "create", "route", null, { name: "Casa–lavoro" }),
    ).toMatchObject({
      ok: false,
      refused: "invalid", // mode is required
    });
    expect(
      await act(db, a, "create", "route", null, { name: "X", values: { mode: "plane" } }),
    ).toMatchObject({ ok: false, refused: "invalid" });
    const r = ok(
      await act(db, a, "create", "route", null, {
        name: "Casa–lavoro",
        values: { mode: "bike", distanceKm: 4.2 },
      }),
    );
    expect(await values(r.id)).toEqual({ mode: "bike", distanceKm: 4.2 });
    expect(
      await act(db, a, "create", "route", null, {
        name: "casa–LAVORO",
        values: { mode: "walk" },
      }),
    ).toMatchObject({ ok: false, refused: "name_taken" });
    ok(await undo(db, a, r.undo!));
    expect((await item(r.id)).deletedAt).not.toBeNull();
  });

  it("levels need their declared parent (MOD-21): a product under a food", async () => {
    expect(await act(db, a, "create", "product", null, { name: "Mutti" })).toMatchObject({
      refused: "invalid",
      detail: "parent",
    });
    const food = ok(await act(db, a, "create", "food", null, { name: "Passata" }));
    const product = ok(
      await act(db, a, "create", "product", null, { name: "Mutti", parentId: food.id }),
    );
    expect((await item(product.id)).parentId).toBe(food.id);
  });

  it("PAT-16 «Parti da…»: values and parts copied, basedOnId kept", async () => {
    const route = ok(
      await act(db, a, "create", "route", null, {
        name: "Giro lungo",
        values: { mode: "run", distanceKm: 12 },
      }),
    );
    const copy = ok(
      await act(db, a, "startFrom", "route", route.id, { name: "Giro corto" }),
    );
    expect((await item(copy.id)).basedOnId).toBe(route.id);
    expect(await values(copy.id)).toEqual({ mode: "run", distanceKm: 12 });
  });

  it("PAT-17 «Variante»: only for types with variants, a child that stores nothing yet", async () => {
    const ex = ok(await act(db, a, "create", "exercise", null, { name: "Panca piana" }));
    const v = ok(
      await act(db, a, "variant", "exercise", ex.id, { name: "Panca stretta" }),
    );
    expect((await item(v.id)).parentId).toBe(ex.id);
    expect(await values(v.id)).toEqual({});
    const route = ok(
      await act(db, a, "create", "route", null, { name: "R", values: { mode: "walk" } }),
    );
    expect(await act(db, a, "variant", "route", route.id, { name: "R2" })).toMatchObject({
      refused: "verb_not_allowed",
    });
  });

  it("PAT-13/PAT-21 «Modifica» + «Annulla»: the undo puts back exactly what was there", async () => {
    const r = ok(
      await act(db, a, "create", "route", null, {
        name: "Stazione",
        values: { mode: "walk", distanceKm: 1 },
      }),
    );
    const e = ok(
      await act(db, a, "edit", "route", r.id, {
        name: "Stazione nord",
        values: { distanceKm: 1.5, mapsUrl: "https://maps.example/x" },
      }),
    );
    expect((await item(r.id)).name).toBe("Stazione nord");
    expect(await values(r.id)).toMatchObject({
      distanceKm: 1.5,
      mapsUrl: "https://maps.example/x",
    });
    ok(await undo(db, a, e.undo!));
    expect((await item(r.id)).name).toBe("Stazione");
    expect(await values(r.id)).toEqual({ mode: "walk", distanceKm: 1 });
    expect(
      await act(db, a, "edit", "route", r.id, { values: { colour: "red" } } as never),
    ).toMatchObject({
      refused: "invalid",
    });
  });

  it("MOD-02/PAT-13 a food's label value edited in place: limits from the registry, undo keeps its source (MOD-12)", async () => {
    const food = ok(await act(db, a, "create", "food", null, { name: "Yogurt greco" }));
    await db.insert(s.catalogValues).values({
      userId: a.id,
      itemId: food.id,
      field: "protein",
      num: "9",
      source: "off",
      confidence: "0.9",
    });
    const e = ok(await act(db, a, "edit", "food", food.id, { values: { protein: 10 } }));
    const row = async () =>
      (
        await db
          .select()
          .from(s.catalogValues)
          .where(
            and(
              eq(s.catalogValues.itemId, food.id),
              eq(s.catalogValues.field, "protein"),
            ),
          )
      )[0]!;
    expect(await row()).toMatchObject({ num: "10.0000", source: "typed" });
    ok(await undo(db, a, e.undo!));
    expect(await row()).toMatchObject({ num: "9.0000", source: "off" });
    expect(Number((await row()).confidence)).toBe(0.9);
    expect(
      await act(db, a, "edit", "food", food.id, { values: { kcal: 1000 } }),
    ).toMatchObject({ refused: "invalid" });
    expect(
      await act(db, a, "edit", "food", food.id, { values: { nova: 5 } }),
    ).toMatchObject({ refused: "invalid" });
  });

  it("PAT-19 «Archivia» ↔ «Ripristina», each the other's undo", async () => {
    const r = ok(await act(db, a, "create", "exercise", null, { name: "Trazioni" }));
    const arch = ok(await act(db, a, "archive", "exercise", r.id, {}));
    expect((await item(r.id)).archivedAt).not.toBeNull();
    expect(arch.undo).toEqual({
      verb: "restore",
      type: "exercise",
      id: r.id,
      payload: {},
    });
    const back = ok(await undo(db, a, arch.undo!));
    expect((await item(r.id)).archivedAt).toBeNull();
    expect(back.undo).toMatchObject({ verb: "archive" });
  });

  it("PAT-20 «Elimina»: an object only when unused, else Archivia is offered", async () => {
    const used = ok(await act(db, a, "create", "exercise", null, { name: "Squat" }));
    await db.insert(s.entries).values({
      userId: a.id,
      kind: "session_exercise",
      day: "2026-11-05",
      status: "done",
      itemId: used.id,
    });
    expect(await act(db, a, "delete", "exercise", used.id, {})).toEqual({
      ok: false,
      refused: "in_use",
      offer: "archive",
    });
    const unused = ok(await act(db, a, "create", "exercise", null, { name: "Affondi" }));
    const del = ok(await act(db, a, "delete", "exercise", unused.id, {}));
    expect((await item(unused.id)).deletedAt).not.toBeNull();
    expect(await act(db, a, "archive", "exercise", unused.id, {})).toMatchObject({
      refused: "not_found",
    });
    ok(await undo(db, a, del.undo!));
    expect((await item(unused.id)).deletedAt).toBeNull();
  });

  it("PAT-20 a voce goes to the trash and its undo brings it back", async () => {
    const [e] = await db
      .insert(s.entries)
      .values({ userId: a.id, kind: "water", day: "2026-11-06", status: "done" })
      .returning({ id: s.entries.id });
    const t = ok(await act(db, a, "trash", "water", e!.id, {}));
    const [gone] = await db.select().from(s.entries).where(eq(s.entries.id, e!.id));
    expect(gone!.deletedAt).not.toBeNull();
    ok(await undo(db, a, t.undo!));
    const [back] = await db.select().from(s.entries).where(eq(s.entries.id, e!.id));
    expect(back!.deletedAt).toBeNull();
    expect(await act(db, a, "trash", "meal", e!.id, {})).toMatchObject({
      refused: "not_found",
    });
  });

  it("PAT-18 «Unisci»: moves the uses, and cannot be undone (undo null)", async () => {
    const keep = ok(await act(db, a, "create", "exercise", null, { name: "Corsa" }));
    const gone = ok(await act(db, a, "create", "exercise", null, { name: "Run" }));
    await db.insert(s.entries).values({
      userId: a.id,
      kind: "session_exercise",
      day: "2026-11-04",
      status: "done",
      itemId: gone.id,
    });
    const m = ok(await act(db, a, "merge", "exercise", gone.id, { into: keep.id }));
    expect(m.undo).toBeNull();
    const moved = await db
      .select()
      .from(s.entries)
      .where(and(eq(s.entries.itemId, keep.id), eq(s.entries.kind, "session_exercise")));
    expect(moved).toHaveLength(1);
  });

  it("PAT-22 / MOD-14 «Salva come pasto»: the meal's lines become the pasto's parts", async () => {
    const food = ok(await act(db, a, "create", "food", null, { name: "Riso" }));
    const [meal] = await db
      .insert(s.entries)
      .values({ userId: a.id, kind: "meal", day: "2026-11-06", status: "done" })
      .returning({ id: s.entries.id });
    await db.insert(s.entryLines).values({
      userId: a.id,
      entryId: meal!.id,
      position: 0,
      itemId: food.id,
      name: "Riso",
      quantity: "80",
      unit: "g",
    });
    const r = ok(
      await act(db, a, "saveAs", "recipe", meal!.id, { name: "Riso in bianco" }),
    );
    expect((await item(r.id)).catalog).toBe("recipe");
    const parts = await db
      .select()
      .from(s.catalogParts)
      .where(eq(s.catalogParts.itemId, r.id));
    expect(parts.map((p) => [p.partItemId, Number(p.quantity), p.unit])).toEqual([
      [food.id, 80, "g"],
    ]);
    expect(await act(db, a, "saveAs", "route", meal!.id, { name: "x" })).toMatchObject({
      refused: "verb_not_allowed",
    });
  });

  it("an assunzione is a food with its flag: the flag is written, a plain food is not one", async () => {
    const coffee = ok(await act(db, a, "create", "intake_item", null, { name: "Caffè" }));
    expect(await values(coffee.id)).toEqual({ intake: true });
    const plain = ok(await act(db, a, "create", "food", null, { name: "Pane" }));
    expect(await act(db, a, "archive", "intake_item", plain.id, {})).toMatchObject({
      refused: "not_found",
    });
  });

  it("refuses an unknown type, and never touches another person's object (ADR-0057)", async () => {
    expect(await act(db, a, "archive", "unicorn", "x", {})).toMatchObject({
      refused: "unknown_type",
    });
    const mine = ok(await act(db, a, "create", "exercise", null, { name: "Rematore" }));
    expect(await act(db, b, "archive", "exercise", mine.id, {})).toMatchObject({
      refused: "not_found",
    });
    expect(await act(db, b, "edit", "exercise", mine.id, { name: "Mio" })).toMatchObject({
      refused: "not_found",
    });
    expect((await item(mine.id)).archivedAt).toBeNull();
  });

  it("readObject reads one live object of its owner, with its declared values (PAT-04)", async () => {
    const r = ok(
      await act(db, a, "create", "route", null, {
        name: "Casa–palestra",
        values: { mode: "bike", distanceKm: 4.2 },
      }),
    );
    expect(await readObject(db, a, "route", r.id)).toMatchObject({
      type: "route",
      name: "Casa–palestra",
      archived: false,
      values: { mode: "bike", distanceKm: 4.2, durationMin: null },
    });
    expect(await readObject(db, b, "route", r.id)).toBeNull();
    expect(await readObject(db, a, "recipe", r.id)).toBeNull();
    expect(await readObject(db, a, "tracker", r.id)).toBeNull();
    ok(await act(db, a, "archive", "route", r.id, {}));
    expect((await readObject(db, a, "route", r.id))?.archived).toBe(true);
    ok(await act(db, a, "delete", "route", r.id, {}));
    expect(await readObject(db, a, "route", r.id)).toBeNull();
  });

  it("listObjects gives the owner's live, not archived objects of a type, by name (PAT-18)", async () => {
    const x = ok(
      await act(db, a, "create", "route", null, {
        name: "Zeta",
        values: { mode: "walk" },
      }),
    );
    const y = ok(
      await act(db, a, "create", "route", null, {
        name: "Alfa",
        values: { mode: "walk" },
      }),
    );
    ok(
      await act(db, b, "create", "route", null, {
        name: "Di b",
        values: { mode: "walk" },
      }),
    );
    const names = async () => (await listObjects(db, a, "route")).map((r) => r.name);
    expect(await names()).toEqual(expect.arrayContaining(["Alfa", "Zeta"]));
    expect(await names()).not.toContain("Di b");
    const all = await names();
    expect(all.indexOf("Alfa")).toBeLessThan(all.indexOf("Zeta"));
    ok(await act(db, a, "archive", "route", x.id, {}));
    expect(await names()).not.toContain("Zeta");
    expect(await listObjects(db, a, "tracker")).toEqual([]);
    ok(await act(db, a, "delete", "route", y.id, {}));
  });

  it("reads, lists and renames a tracker, with its undo (PAT-04, PAT-13, PAT-24)", async () => {
    const made = (name: string) => {
      const b = buildUserKind(
        { name, family: "habit", shape: "instant", fields: [] },
        new Set(),
      );
      if (!b.ok) throw new Error("kind");
      return b.row;
    };
    await createUserKind(db, a, made("Stretching"));
    await createUserKind(db, a, made("Meditazione"));
    const listed = await listObjects(db, a, "tracker");
    expect(listed.map((k) => k.name)).toEqual(["Meditazione", "Stretching"]);
    expect(await listObjects(db, b, "tracker")).toEqual([]);
    const id = listed[1]!.id;
    expect(await readObject(db, a, "tracker", id)).toMatchObject({
      type: "tracker",
      name: "Stretching",
      archived: false,
      values: {},
    });
    expect(await readObject(db, b, "tracker", id)).toBeNull();
    const r = ok(await act(db, a, "edit", "tracker", id, { name: "Allungamento" }));
    expect((await readObject(db, a, "tracker", id))?.name).toBe("Allungamento");
    ok(await undo(db, a, r.undo!));
    expect((await readObject(db, a, "tracker", id))?.name).toBe("Stretching");
    expect(
      await act(db, a, "edit", "tracker", id, { name: "meditazione" }),
    ).toMatchObject({
      refused: "name_taken",
    });
    expect(await act(db, a, "edit", "tracker", id, { name: "x" })).toMatchObject({
      refused: "invalid",
    });
    expect(await act(db, b, "edit", "tracker", id, { name: "Mio" })).toMatchObject({
      refused: "not_found",
    });
    ok(await act(db, a, "archive", "tracker", id, {}));
    expect((await listObjects(db, a, "tracker")).map((k) => k.name)).toEqual([
      "Meditazione",
    ]);
    expect((await readObject(db, a, "tracker", id))?.archived).toBe(true);
  });
});
