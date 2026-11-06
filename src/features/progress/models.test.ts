import { describe, expect, it } from "vitest";
import { REGISTRY } from "@/core/engines/judgements";
import { MODEL_WORDS, MODELS, modelPage } from "./models";

describe("«Come valutiamo»", () => {
  it("has words for every model and every part of the registry", () => {
    for (const m of REGISTRY) {
      expect(MODEL_WORDS[m.id], m.id).toBeDefined();
      for (const p of m.parts)
        expect(MODEL_WORDS[m.id]!.parts[p.key], p.key).toBeDefined();
    }
    expect(MODELS.map((m) => m.id)).toEqual([
      "food",
      "weighing",
      "sleep",
      "water",
      "session",
      "day",
    ]);
  });

  it("gives each part its share, its range and its lock", () => {
    const p = modelPage(REGISTRY.find((m) => m.id === "sleep")!);
    expect(p.parts.map((x) => [x.name, x.share, x.min, x.max, x.locked])).toEqual([
      ["Durata vs bisogno", "35 %", 25, 50, false],
      ["Regolarità", "35 %", 30, 100, true],
      ["Notte senza risvegli", "10 %", 0, 20, false],
      ["Come ti senti", "20 %", 0, 30, false],
    ]);
  });
});
