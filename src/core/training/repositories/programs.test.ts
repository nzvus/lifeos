/** Tests for the programs repository (ADR-0024): one active, mine only, a plan from what was done. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { listTrash, restoreFromTrash } from "../../trash/trash";
import { createExercise } from "./exercises";
import {
  createProgram,
  deleteProgram,
  getActivePlan,
  listPrograms,
  programOverrideDays,
  programSlotOn,
  resetProgramDay,
  skipProgramDay,
  setProgramDay,
  swapProgramDays,
  updateProgram,
} from "./programs";
import { createRoutine } from "./routines";
import { createSession } from "./sessions";

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

async function routine(owner: Owner, name: string) {
  const ex = await createExercise(db, owner, {
    name: `${name} lift`,
    kind: "strength",
    muscleGroups: [],
    pattern: null,
    equipment: null,
    unilateral: false,
    notes: "",
  });
  if (!ex.ok) throw new Error("setup");
  const r = await createRoutine(db, owner, {
    name,
    notes: "",
    items: [
      {
        exerciseId: ex.value.id,
        sets: 3,
        reps: 10,
        loadKg: "40",
        durationS: null,
        restS: 90,
      },
    ],
  });
  if (!r.ok) throw new Error("setup");
  return { routineId: r.value.id, exerciseId: ex.value.id };
}

const program = (slots: { routineId: string | null; label?: string }[], v = {}) => ({
  name: "PPL",
  notes: "",
  startDay: "2026-10-01",
  active: true,
  slots: slots.map((s) => ({
    label: s.label ?? "",
    items: s.routineId ? [{ routineId: s.routineId, exerciseId: null }] : [],
  })),
  ...v,
});

describe("programs", () => {
  it("saves ordered slots; one active at a time; another user's routine is refused", async () => {
    const push = await routine(me, "Push");
    const pull = await routine(me, "Pull");
    const theirs = await routine(other, "Theirs");
    const a = await createProgram(
      db,
      me,
      program([push, pull, { routineId: null, label: "Rest" }]),
    );
    if (!a.ok) throw new Error("setup");
    expect((await listPrograms(db, me))[0]!.slots.map((s) => s.name)).toEqual([
      "Push",
      "Pull",
      "Rest",
    ]);
    const b = await createProgram(db, me, program([pull], { name: "Only pull" }));
    if (!b.ok) throw new Error("setup");
    expect((await listPrograms(db, me)).map((p) => [p.name, p.active])).toEqual([
      ["Only pull", true],
      ["PPL", false],
    ]);
    expect(await createProgram(db, me, program([push, theirs]))).toEqual({
      ok: false,
      errors: { "slots.1.items.0": "not_found" },
    });
    expect(await listPrograms(db, other)).toEqual([]);
    expect(await updateProgram(db, other, a.value.id, program([theirs]))).toEqual({
      ok: false,
      errors: { _form: "not_found" },
    });
  });

  it("the plan follows what was done, and the trash takes the program out of it", async () => {
    const push = await routine(me, "Push");
    const pull = await routine(me, "Pull");
    const p = await createProgram(
      db,
      me,
      program([push, pull, { routineId: null, label: "Rest" }]),
    );
    if (!p.ok) throw new Error("setup");
    await createSession(
      db,
      me,
      {
        day: "2026-10-01",
        label: "Push",
        status: "done",
        time: "18:00",
        durationMin: 60,
        notes: "",
        routineId: push.routineId,
        exercises: [],
        intensity: "moderate",
        kcalEstimate: null,
        muscleGroups: [],
      },
      "UTC",
    );
    const plan = await getActivePlan(db, me, "2026-10-03", 3);
    // 2 Oct: pull missed → still due on the 3rd, late.
    expect(
      plan?.plan.map((d) => [d.day, d.slot.items[0]?.routineId ?? null, d.late]),
    ).toEqual([
      ["2026-10-03", pull.routineId, true],
      ["2026-10-04", null, false],
      ["2026-10-05", push.routineId, false],
    ]);
    expect(
      (await programSlotOn(db, me, "2026-10-03", "2026-10-05"))?.slot.items[0]?.routineId,
    ).toBe(push.routineId);
    expect(await programSlotOn(db, me, "2026-10-03", "2026-10-01")).toBeNull();
    expect(await getActivePlan(db, other, "2026-10-03")).toBeNull();

    await deleteProgram(db, me, p.value.id);
    expect(await getActivePlan(db, me, "2026-10-03")).toBeNull();
    expect((await listTrash(db, me)).map((t) => t.kind)).toEqual(["program"]);
    await restoreFromTrash(db, me, "program", p.value.id);
    expect((await listPrograms(db, me)).length).toBe(1);
  });

  it("ADR-0035: a day holds a list (routine and exercise); another user's exercise is refused", async () => {
    const push = await routine(me, "Push");
    const theirs = await routine(other, "Theirs");
    const p = await createProgram(db, me, {
      ...program([push]),
      slots: [
        {
          label: "",
          items: [
            { routineId: push.routineId, exerciseId: null },
            { routineId: null, exerciseId: push.exerciseId },
          ],
        },
        { label: "Riposo", items: [] },
      ],
    });
    if (!p.ok) throw new Error("setup");
    const [prog] = await listPrograms(db, me);
    expect(prog!.slots.map((s) => [s.name, s.items.length])).toEqual([
      ["Push + Push lift", 2],
      ["Riposo", 0],
    ]);
    expect(
      await createProgram(db, me, {
        ...program([]),
        slots: [
          { label: "", items: [{ routineId: null, exerciseId: theirs.exerciseId }] },
        ],
      }),
    ).toEqual({ ok: false, errors: { "slots.0.items.0": "not_found" } });
  });

  it("ADR-0035: skipping a day passes its slot; a change of the day replaces the skip", async () => {
    const push = await routine(me, "Push");
    const pull = await routine(me, "Pull");
    const p = await createProgram(db, me, program([push, pull]));
    if (!p.ok) throw new Error("setup");
    const names = async () =>
      (await getActivePlan(db, me, "2026-10-01", 3))!.plan.map((d) =>
        d.skipped
          ? "skip"
          : d.slot.items[0]?.routineId === push.routineId
            ? "push"
            : "pull",
      );
    expect(await skipProgramDay(db, me, "2026-10-01", "2026-09-30")).toEqual({
      ok: false,
      errors: { day: "past_day" },
    });
    await skipProgramDay(db, me, "2026-10-01", "2026-10-01");
    expect(await names()).toEqual(["skip", "pull", "push"]);
    expect([...(await programOverrideDays(db, me, p.value.id, "2026-10-01"))]).toEqual([
      "2026-10-01",
    ]);
    await resetProgramDay(db, me, "2026-10-01");
    expect(await names()).toEqual(["push", "pull", "push"]);
  });
});

describe("changing coming days (ADR-0029)", () => {
  const TODAY = "2026-10-01";
  const labels = async (owner: Owner) =>
    (await getActivePlan(db, owner, TODAY, 4))!.plan.map((d) =>
      d.slot.position < 0 ? "rest" : String(d.slot.position),
    );

  it("swap, rest, reset; a past day is refused; editing the slots clears overrides", async () => {
    const push = await routine(me, "Push");
    const pull = await routine(me, "Pull");
    const legs = await routine(me, "Legs");
    const p = await createProgram(
      db,
      me,
      program([
        { routineId: push.routineId },
        { routineId: pull.routineId },
        { routineId: legs.routineId },
      ]),
    );
    if (!p.ok) throw new Error("setup");
    expect(await labels(me)).toEqual(["0", "1", "2", "0"]);

    expect((await swapProgramDays(db, me, TODAY, "2026-10-01", "2026-10-03")).ok).toBe(
      true,
    );
    expect(await labels(me)).toEqual(["2", "1", "0", "0"]); // day 4 is Push, as before

    await setProgramDay(db, me, TODAY, "2026-10-02", null);
    expect((await labels(me))[1]).toBe("rest");
    await resetProgramDay(db, me, "2026-10-02");
    expect((await labels(me))[1]).toBe("1");

    expect((await setProgramDay(db, me, TODAY, "2026-09-30", 1)).ok).toBe(false);
    expect((await setProgramDay(db, me, TODAY, "2026-10-02", 7)).ok).toBe(false);
    // Another user has no active program: nothing to change.
    expect((await setProgramDay(db, other, TODAY, "2026-10-02", 0)).ok).toBe(false);

    // Same slots again (a rename): the overrides stay.
    await updateProgram(
      db,
      me,
      p.value.id,
      program(
        [
          { routineId: push.routineId },
          { routineId: pull.routineId },
          { routineId: legs.routineId },
        ],
        { name: "PPL 2" },
      ),
    );
    expect((await labels(me))[0]).toBe("2");
    // Different slots: they go.
    await updateProgram(
      db,
      me,
      p.value.id,
      program([{ routineId: legs.routineId }, { routineId: push.routineId }]),
    );
    expect(await labels(me)).toEqual(["0", "1", "0", "1"]);
  });
});
