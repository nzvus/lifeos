import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { V1Export } from "../convert/context";
import { convert } from "../convert/convert";
import { loadFile } from "../convert/load";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { addDays } from "../engines/time";
import { loadDay, loadDays } from "./index";
import { dayMinute } from "./timeline";

const fixture = (): V1Export =>
  JSON.parse(
    readFileSync(
      new URL("../convert/fixtures/v1-everything.json", import.meta.url),
      "utf8",
    ),
  ) as V1Export;

const DAY = "2026-10-10";
const SESSION = "ef0a1dbe-7213-41fb-bd61-4b89f8ea3e71";
const BREAKFAST = "8735d0b0-1bc3-4f2d-a7af-7b27cd755b8e";
const UNTIMED_MEAL = "03d16a4d-4386-4fdd-8921-ce4cf3596ac2";

describe("one logical day (V-01)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  const add = (owner: Owner, row: Partial<typeof s.entries.$inferInsert>) =>
    db
      .insert(s.entries)
      .values({ userId: owner.id, kind: "meal", day: DAY, status: "done", ...row })
      .returning({ id: s.entries.id })
      .then((r) => r[0]!.id);

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    const v1 = fixture();
    // v1's post-workout moment: in v2 the role comes from the time (19:30 in Rome).
    v1.tables["log_entries"]!.push({
      ...v1.tables["log_entries"]!.find((e) => e["id"] === BREAKFAST)!,
      id: "11111111-1111-4111-8111-111111111111",
      at: "2026-10-10T17:30:00.000Z",
      moment: "post_workout",
    });
    for (const l of v1.tables["log_entry_items"] ?? []) l["entryId"] ??= BREAKFAST;
    await loadFile(db as never, convert(v1, new Date("2026-10-17T12:00:00Z")), a.id);
  });
  afterAll(() => close());

  it("reads a range as each of its days alone", async () => {
    const days = await loadDays(db, a, addDays(DAY, -1), addDays(DAY, 1));
    expect(days.map((d) => d.day)).toEqual([addDays(DAY, -1), DAY, addDays(DAY, 1)]);
    expect(days[1]).toEqual(await loadDay(db, a, DAY));
    expect((await loadDays(db, b, DAY, DAY))[0]!.timed).toEqual([]);
  });

  it("sorts the timed entries by their minute of the day; sleep sits at the wake", async () => {
    const day = await loadDay(db, a, DAY);
    const order = day.timed.map((i) => [i.kind.key, i.minute]);
    expect(order).toEqual([
      ["sleep", 8 * 60 + 15],
      ["weigh_in", 8 * 60 + 30],
      ["meal", 9 * 60 + 30],
      ["batch", 10 * 60],
      ["session", 18 * 60],
      ["meal", 19 * 60 + 30],
    ]);
    expect(day.clock).toEqual({ timeZone: "Europe/Rome", boundaryMin: 240 });
  });

  it("keeps the untimed ones apart, and nests a session's exercises with their sets", async () => {
    const day = await loadDay(db, a, DAY);
    expect(day.untimed.map((i) => i.kind.key).sort()).toEqual(
      ["checkin", "journal", "meal", "steps"].sort(),
    );
    expect(day.untimed.find((i) => i.id === UNTIMED_MEAL)!.subcategory).toBeNull();
    const session = day.timed.find((i) => i.id === SESSION)!;
    expect(session.children.map((c) => c.kind.key)).toEqual(["session_exercise"]);
    expect(session.children[0]!.sets.length).toBeGreaterThan(0);
    expect(session.children[0]!.item?.name).not.toBe("");
    for (const i of [...day.timed, ...day.untimed]) expect(i.kind.child).toBe(false);
  });

  it("names a meal by its role, or by its time when v1 called it post-workout; tags it by the session", async () => {
    const day = await loadDay(db, a, DAY);
    const meals = day.timed.filter((i) => i.kind.key === "meal");
    expect(meals.map((m) => m.subcategory)).toEqual(["breakfast", "dinner"]);
    expect(meals[1]!.values["role"]).toBeUndefined();
    expect(meals[1]!.tags).toEqual(["post-workout"]);
    expect(meals[0]!.tags).toEqual([]);
    expect(meals[0]!.lines.length).toBeGreaterThan(0);
    expect(Object.keys(meals[0]!.lines[0]!.values)).toContain("kcal");
  });

  it("puts 01:30 of the next night at the end of the logical day", async () => {
    const id = await add(a, { startAt: new Date("2026-10-10T23:30:00.000Z") });
    const day = await loadDay(db, a, DAY);
    expect(day.timed.at(-1)).toMatchObject({ id, minute: 24 * 60 + 90 });
    expect(day.timed.at(-1)!.subcategory).toBe("snack");
    await db.delete(s.entries).where(eq(s.entries.id, id));
  });

  it("folds a planned entry into the one that fulfils it", async () => {
    const planned = await add(a, {
      status: "planned",
      startAt: new Date("2026-10-10T07:00:00.000Z"),
    });
    await db
      .insert(s.entryLinks)
      .values({ userId: a.id, fromId: BREAKFAST, toId: planned, relation: "fulfils" });
    const day = await loadDay(db, a, DAY);
    const all = [...day.timed, ...day.untimed].map((i) => i.id);
    expect(all).not.toContain(planned);
    expect(day.timed.find((i) => i.id === BREAKFAST)!.fulfils).toBe(planned);
  });

  it("shows another person nothing of mine, and me nothing of theirs", async () => {
    const theirs = await add(b, { startAt: new Date("2026-10-10T10:00:00.000Z") });
    const mine = await loadDay(db, a, DAY);
    expect([...mine.timed, ...mine.untimed].map((i) => i.id)).not.toContain(theirs);
    const their = await loadDay(db, b, DAY);
    expect(their.timed.map((i) => i.id)).toEqual([theirs]);
    expect(their.untimed).toEqual([]);
    expect(their.clock.timeZone).toBe("Europe/Rome");
  });

  it("an empty day is empty, not an error", async () => {
    const day = await loadDay(db, a, "2020-01-01");
    expect([day.timed, day.untimed]).toEqual([[], []]);
  });

  it("counts the day's minutes across a clock change", () => {
    const clock = { timeZone: "Europe/Rome", boundaryMin: 240 };
    // 25 Oct 2026: the clocks go back at 03:00. 23:00 local on the 25th is 22:00Z.
    expect(dayMinute(new Date("2026-10-25T22:00:00Z"), "2026-10-25", clock)).toBe(
      23 * 60,
    );
    expect(dayMinute(new Date("2026-10-26T01:00:00Z"), "2026-10-25", clock)).toBe(
      24 * 60 + 2 * 60,
    );
  });
});
