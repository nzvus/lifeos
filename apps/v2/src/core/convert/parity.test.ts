import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "../db/schema";
import { createTestDb, createTestUser, type TestDb } from "../db/test-db";
import type { V1Export } from "./context";
import { convert } from "./convert";
import { loadFile } from "./load";
import { compare, v1Metrics, v2Metrics } from "./parity";

const fixture = (): V1Export =>
  JSON.parse(
    readFileSync(new URL("./fixtures/v1-everything.json", import.meta.url), "utf8"),
  ) as V1Export;

describe("parity: v1 computed against v2 computed", () => {
  let db: TestDb;
  let close: () => Promise<void>;
  let owner: string;
  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    owner = await createTestUser(db, "parity@example.test");
    await loadFile(
      db as never,
      convert(fixture(), new Date("2026-10-17T12:00:00Z")),
      owner,
    );
  });
  afterAll(() => close());

  it("every number of the fixture is equal on both sides", async () => {
    const a = v1Metrics(fixture());
    const p = compare(a, await v2Metrics(db as never, owner));
    expect(p.different).toEqual([]);
    expect(p.equal).toBeGreaterThan(20);
    for (const k of [
      "food|",
      "training|",
      "e1rm|",
      "body|",
      "sleep|",
      "money|",
      "count|meal",
    ])
      expect([...a.keys()].some((x) => x.startsWith(k))).toBe(true);
  });

  it("a changed snapshot value is found, with both numbers", async () => {
    const [line] = await db
      .select()
      .from(s.entryLineValues)
      .where(eq(s.entryLineValues.field, "kcal"))
      .limit(1);
    await db
      .update(s.entryLineValues)
      .set({ num: "1" })
      .where(eq(s.entryLineValues.lineId, line!.lineId));
    const p = compare(v1Metrics(fixture()), await v2Metrics(db as never, owner));
    expect(p.different.some((d) => d.key.endsWith("|kcal") && d.v1 !== d.v2)).toBe(true);
  });

  it("compares decimals by value: 18.5 and 18.5000 are equal", () => {
    expect(
      compare(new Map([["x", "18.5"]]), new Map([["x", "18.5000"]])).different,
    ).toEqual([]);
    expect(compare(new Map([["x", "1"]]), new Map()).different).toEqual([
      { key: "x", v1: "1", v2: undefined },
    ]);
  });
});
