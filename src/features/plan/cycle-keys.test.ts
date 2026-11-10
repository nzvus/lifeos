import { describe, expect, it } from "vitest";
import { newStepKey, stepOf } from "./cycle-keys";

const ID = "5bf884d1-e92d-4b89-9bcf-6b9ab407d38b";

describe("a ciclo's lines in its Composer (PAT-62, PL-30; Q-16)", () => {
  it("a kept step, the same scheda twice, a rest; anything else is no step", () => {
    expect(stepOf(ID)).toEqual({ step: ID });
    expect(stepOf(newStepKey(0, ID))).toEqual({ item: ID });
    expect(newStepKey(1, ID)).not.toBe(newStepKey(0, ID));
    expect(stepOf(newStepKey(2, null))).toEqual({ rest: true });
    for (const bad of ["", "new.x.rest", "new.1.push", "rest"])
      expect(stepOf(bad)).toBeNull();
  });
});
