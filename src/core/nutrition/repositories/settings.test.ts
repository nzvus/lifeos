/**
 * Tests for per-user settings, on real Postgres (PGlite): defaults before the
 * row exists, saving (upsert) the theme with the rest (ADR-0010), falling
 * back when the text column holds an unknown value, cross-user isolation.
 */
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import { userSettings } from "../../db/schema";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { DEFAULT_PREFERENCES } from "../preferences";
import { getSettings, savePreferences, saveSettings } from "./settings";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

describe("settings", () => {
  it("returns the defaults before anything is saved", async () => {
    expect(await getSettings(db, me)).toEqual({
      timezone: "Europe/Rome",
      locale: "it",
      theme: "label",
      preferences: DEFAULT_PREFERENCES,
    });
  });

  it("saves the theme with the rest, and saving again updates the row", async () => {
    await saveSettings(db, me, {
      timezone: "Europe/Rome",
      locale: "it",
      theme: "quaderno",
    });
    await saveSettings(db, me, { timezone: "UTC", locale: "en", theme: "notte" });
    expect(await getSettings(db, me)).toMatchObject({
      timezone: "UTC",
      locale: "en",
      theme: "notte",
    });
  });

  it("falls back to the default theme for an unknown stored value", async () => {
    await saveSettings(db, me, { timezone: "UTC", locale: "it", theme: "quaderno" });
    await db
      .update(userSettings)
      .set({ theme: "removed-theme" })
      .where(eq(userSettings.userId, me.id));
    expect((await getSettings(db, me)).theme).toBe("label");
  });

  it("never reads another user's settings", async () => {
    await saveSettings(db, other, { timezone: "UTC", locale: "en", theme: "notte" });
    expect((await getSettings(db, me)).theme).toBe("label");
  });

  it("saves preferences without touching the other settings", async () => {
    await saveSettings(db, me, { timezone: "UTC", locale: "en", theme: "quaderno" });
    await savePreferences(db, me, {
      autoTargets: false,
      lunchFrom: 720,
      snackFrom: 960,
      dinnerFrom: 1170,
      trendsRange: 30,
      listSort: "fiber",
      listPer: "cost",
    });
    const s = await getSettings(db, me);
    expect(s.theme).toBe("quaderno");
    expect(s.preferences).toEqual({
      autoTargets: false,
      bounds: { lunch: 720, snack: 960, dinner: 1170 },
      trendsRange: 30,
      listSort: "fiber",
      listPer: "cost",
    });
    expect((await getSettings(db, other)).preferences).toEqual(DEFAULT_PREFERENCES);
  });
});
