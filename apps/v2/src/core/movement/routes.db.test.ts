import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { readEntry } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { createRoute, logTrip, readRoutes } from "./routes";

describe("routes and trips", () => {
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

  it("a route, a taken name, a trip along it counted, the owner's only", async () => {
    const r = {
      name: "Casa → palestra",
      mode: "walk" as const,
      distanceKm: 1.4,
      durationMin: 18,
      walkingM: 1400,
      mapsUrl: null,
    };
    const id = await createRoute(db, a, r);
    expect(typeof id).toBe("string");
    expect(await createRoute(db, a, { ...r, name: "casa → PALESTRA" })).toBe("taken");
    const [route] = await readRoutes(db, a, "2026-07-01");
    const trip = await logTrip(
      db,
      a,
      route!,
      "2026-10-25",
      new Date("2026-10-25T16:00:00Z"),
      18,
    );
    expect((await readRoutes(db, a, "2026-07-01"))[0]!.uses).toBe(1);
    expect(await readRoutes(db, b, "2026-07-01")).toEqual([]);
    const e = await readEntry(db, a, trip);
    expect(e?.kind.key).toBe("trip");
    expect(e?.values).toMatchObject({
      mode: "walk",
      distanceKm: "1.4000",
      walkingM: "1400.0000",
    });
    expect(e?.item?.name).toBe("Casa → palestra");
  });
});
