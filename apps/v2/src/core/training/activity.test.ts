import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { readEntry } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { checkActivity, logActivity, paceSPerKm } from "./activity";
import * as schema from "../db/schema";

describe("an activity done (activity.md)", () => {
  it("checks minutes, km with a comma, effort 0–10", () => {
    expect(checkActivity({ minutes: "30", km: "4,5", rpe: "4" })).toEqual({
      ok: true,
      activity: { minutes: 30, km: 4.5, rpe: 4 },
    });
    expect(checkActivity({ minutes: "30", km: "", rpe: "" })).toEqual({
      ok: true,
      activity: { minutes: 30, km: null, rpe: null },
    });
    expect(checkActivity({ minutes: "0", km: "x", rpe: "11" })).toEqual({
      ok: false,
      errors: ["minutes", "km", "rpe"],
    });
  });

  it("30 min for 4,5 km → 6:40 per km", () => {
    expect(paceSPerKm({ minutes: 30, km: 4.5, rpe: null })).toBe(400);
  });

  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
  });
  afterAll(() => close());

  it("28 Oct: a run ended 19:42, 30 min, 4,5 km → one finished session, no empty set", async () => {
    const [run] = await db
      .insert(schema.catalogItems)
      .values({ userId: a.id, catalog: "exercise", name: "Corsa" })
      .returning({ id: schema.catalogItems.id });
    const end = new Date("2026-10-28T18:42:00Z");
    const id = await logActivity(db, a, {
      day: "2026-10-28",
      exerciseId: run!.id,
      label: "Corsa",
      end,
      activity: { minutes: 30, km: 4.5, rpe: 4 },
    });
    const s = (await readEntry(db, a, id))!;
    expect(s.status).toBe("done");
    expect(s.values).toMatchObject({
      durationMin: "30.0000",
      rpe: "4.0000",
      label: "Corsa",
    });
    expect(s.children).toHaveLength(1);
    expect(s.children[0]!.sets).toMatchObject([
      { durationS: 1800, distanceM: "4500.0", speedKmh: "9.00", done: true },
    ]);
  });
});
