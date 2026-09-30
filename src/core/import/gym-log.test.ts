/** Tests for core/import/gym-log.ts, on excerpts of the developer's real notes. */
import { describe, expect, it } from "vitest";
import { tonnage } from "../training/analysis";
import { parseGymLog } from "./gym-log";

const PULL_1 = `PULl

Pause da 1.30

Pulley row
3x10 da 35

Reverse peck deck
10 da 20
8 da 20
10 da 15

Chest supp row 
8 con 2 da 17.5
2x10 con 2 da 15

Lat pulldown
8 da 35
10 da 30
8 da 30

Preacher curl
3x10 con 2 da 5 + asta

Cable biceps curl
8 da 35
10 da 30
8 da 30

Hanging folded legs raises
3x10

Upper abdominal machine
3x12 da 65

Compiuto in circa 1 ora`;

describe("parseGymLog", () => {
  it("reads label, day and time from the file name, rest, sets and duration", () => {
    const s = parseGymLog("PULL 1_260915_143631.txt", PULL_1);
    expect([s.label, s.day, s.time, s.durationMin, s.warnings]).toEqual([
      "PULL 1",
      "2026-09-15",
      "14:36",
      60,
      [],
    ]);
    expect(s.exercises.map((e) => [e.name, e.sets.length, e.restS])).toEqual([
      ["Pulley row", 3, 90],
      ["Reverse peck deck", 3, 90],
      ["Chest supp row", 3, 90],
      ["Lat pulldown", 3, 90],
      ["Preacher curl", 3, 90],
      ["Cable biceps curl", 3, 90],
      ["Hanging folded legs raises", 3, 90],
      ["Upper abdominal machine", 3, 90],
    ]);
    const row = s.exercises[2]!.sets[0]!;
    expect(row).toEqual({ reps: 8, loadKg: "35", loadText: "2×17,5", loadApprox: false });
    expect(s.exercises[4]!.sets[0]).toEqual({
      reps: 10,
      loadKg: "10",
      loadText: "2×5 + asta",
      loadApprox: true,
    });
    expect(s.exercises[6]!.sets[0]).toEqual({
      reps: 10,
      loadKg: null,
      loadText: null,
      loadApprox: false,
    });
  });

  it("gives the hand-made tonnage of PULL 1, abs excluded: 4 080 kg", () => {
    const s = parseGymLog("PULL 1_260915_143631.txt", PULL_1);
    const main = s.exercises.filter((e) => !/abdominal|legs raises/i.test(e.name));
    expect(
      main.reduce(
        (sum, e) => sum + tonnage(e.sets.map((x) => ({ ...x, warmup: false }))),
        0,
      ),
    ).toBe(4080);
  });

  it("keeps notes, warm-up prose, per-exercise rests and odd spacing", () => {
    const s = parseGymLog(
      "PUSH 4_260923_092135.txt",
      `PUSH

Prima di ogni tipo di esercizio ho fatto 3 serie di riscaldamento.

Pause da 1.20 (quando alterno le braccia faccio metà)

Incline db press
2x10da 14

Preacher curl (pause da 60 sec)
7 con 2 da 10 + asta

Cable lateral raise
8 da 10
(reps da un braccio e poi dall'altro x3)

30 sec di pausa tra serie

Upper abdominal machine (no)
3x10 da 60

Sento spalle e collo molto indolenziti

strano!

Compiuto in 55 min`,
    );
    expect(s.notes).toBe(
      "Prima di ogni tipo di esercizio ho fatto 3 serie di riscaldamento. " +
        "quando alterno le braccia faccio metà " +
        "Sento spalle e collo molto indolenziti",
    );
    expect(s.exercises.map((e) => [e.name, e.restS, e.notes])).toEqual([
      ["Incline db press", 80, ""],
      ["Preacher curl", 60, "pause da 60 sec"],
      ["Cable lateral raise", 80, "reps da un braccio e poi dall'altro x3"],
      ["Upper abdominal machine", 30, "no"],
    ]);
    expect(s.exercises[0]!.sets).toHaveLength(2);
    expect(s.durationMin).toBe(55);
    expect(s.warnings).toEqual(['line not understood: "strano!"']);
  });
});
