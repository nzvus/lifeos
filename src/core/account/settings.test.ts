import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { checkSettings, hasSettings, readSettings, saveSettings } from "./settings";

const form = (over = {}) => ({
  sex: "male",
  birthYear: "1998",
  heightCm: "178,5",
  timeZone: "Europe/Rome",
  boundary: "04:00",
  ...over,
});

describe("the settings form", () => {
  it("reads a profile and the day's clock", () => {
    expect(checkSettings(form(), 2026)).toEqual({
      ok: true,
      profile: {
        sex: "male",
        birthYear: 1998,
        heightCm: "178.5",
        timeZone: "Europe/Rome",
        boundaryMin: 240,
      },
    });
    expect(
      checkSettings(form({ sex: "", birthYear: "", heightCm: "" }), 2026),
    ).toMatchObject({
      ok: true,
      profile: { sex: null, birthYear: null, heightCm: null },
    });
  });

  it("refuses what is not a person or a clock", () => {
    expect(
      checkSettings(
        form({
          sex: "x",
          birthYear: "2015",
          heightCm: "40",
          timeZone: "Mars/Base",
          boundary: "13:00",
        }),
        2026,
      ),
    ).toEqual({
      ok: false,
      errors: {
        sex: "invalid",
        birthYear: "range",
        heightCm: "range",
        timeZone: "invalid",
        boundary: "range",
      },
    });
  });
});

describe("saving the settings", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
  });
  afterAll(() => close());

  it("makes the row on the first save, changes it after; another person's stays", async () => {
    expect(await hasSettings(db, a)).toBe(false);
    expect((await readSettings(db, a)).boundaryMin).toBe(240);
    const p = checkSettings(form(), 2026);
    if (!p.ok) throw new Error("expected valid settings");
    await saveSettings(db, a, p.profile);
    await saveSettings(db, a, { ...p.profile, boundaryMin: 300 });
    expect(await readSettings(db, a)).toEqual({
      ...p.profile,
      heightCm: "178.5",
      boundaryMin: 300,
    });
    expect(await hasSettings(db, b)).toBe(false);
  });
});
