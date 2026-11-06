import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { readClock } from "../day";
import { editWeights, FOOD } from "../engines/judgements";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { saveWeights, weightsOf } from "./weights";

describe("the person's weights (V-16)", () => {
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

  it("kept per model in prefs next to the rest, read with the clock, taken out", async () => {
    const { weights } = editWeights(FOOD, { density: 45 }, "2026-10-25");
    await saveWeights(db, a, "food", weights);
    await db
      .update(s.settings)
      .set({ prefs: { lunchFrom: 690, weights: { food: weights } } })
      .where(eq(s.settings.userId, a.id));
    await saveWeights(db, a, "sleep", {
      model: "sleep",
      version: 1,
      since: "2026-10-25",
      values: { duration: 50 },
    });
    const read = (await readClock(db, a)).weights;
    expect(read["food"]?.values).toEqual({ density: 45 });
    expect(read["sleep"]?.values).toEqual({ duration: 50 });
    await saveWeights(db, a, "food", null);
    expect((await readClock(db, a)).weights["food"]).toBeUndefined();
    const [row] = await db
      .select({ p: s.settings.prefs })
      .from(s.settings)
      .where(eq(s.settings.userId, a.id));
    expect(row!.p["lunchFrom"]).toBe(690);
  });

  it("ignores what does not read as weights", () => {
    expect(weightsOf({ weights: { food: { model: "sleep" }, day: "x" } })).toEqual({});
  });
});
