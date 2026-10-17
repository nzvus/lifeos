/**
 * E7 — the registry: the models whose parts, weights and ranges engines.md E7
 * declares. Day targets, distribution, recovery and habits have parts but no
 * weights in the spec yet; they join the registry when their weights are
 * chosen from their evidence (never a shared pattern by default).
 * NOVA is shown, not scored.
 */
import type { ScoringModel } from "./model";

const DATE = "2026-10-17";
const w = (d: number, min: number, max: number) => ({ default: d, min, max });

export const FOOD: ScoringModel = {
  id: "food",
  domain: "food",
  version: 1,
  date: DATE,
  parts: [
    {
      key: "density",
      weight: w(40, 25, 60),
      why: "Nutrients per 100 kcal: protein × DIAAS, fibre, K, Ca, Fe, Mg, vitamins A/C/D, folate, omega-3.",
    },
    {
      key: "limits",
      weight: w(25, 20, 100),
      locked: true,
      why: "Free sugars, sodium, saturated and trans fat per 100 kcal: health limits.",
    },
    { key: "value", weight: w(15, 0, 30), why: "Useful nutrients per euro." },
    {
      key: "fit",
      weight: w(20, 0, 30),
      why: "kcal and protein against the block's shares.",
    },
  ],
  sources: [
    "NRF 9.3 (Drewnowski 2009)",
    "WHO 2015/2023",
    "EFSA DRVs",
    "FAO 2013 (DIAAS)",
  ],
};

export const SLEEP: ScoringModel = {
  id: "sleep",
  domain: "sleep",
  version: 1,
  date: DATE,
  parts: [
    {
      key: "duration",
      weight: w(40, 30, 50),
      why: "Hours slept against the person's need.",
    },
    {
      key: "regularity",
      weight: w(40, 30, 100),
      locked: true,
      why: "Bed and wake times against the 7-day mean: regularity predicts mortality better than duration.",
    },
    { key: "feel", weight: w(20, 0, 30), why: "The morning check-in." },
  ],
  sources: ["Windred 2024", "Hirshkowitz 2015"],
};

export const SESSION: ScoringModel = {
  id: "session",
  domain: "training",
  version: 1,
  date: DATE,
  parts: [
    {
      key: "progression",
      weight: w(40, 25, 50),
      why: "e1RM, or reps at the same load, against the last sessions.",
    },
    { key: "volume", weight: w(30, 20, 40), why: "Hard sets against the block's plan." },
    {
      key: "effort",
      weight: w(20, 10, 30),
      why: "Reps in reserve within the planned band.",
    },
    { key: "rests", weight: w(10, 0, 20), why: "Rests within the exercise's range." },
  ],
  sources: ["Schoenfeld 2017", "Helms 2016 (RIR)", "Grgic 2017"],
};

export const WEIGHING: ScoringModel = {
  id: "weighing",
  domain: "body",
  version: 1,
  date: DATE,
  parts: [
    {
      key: "reliable",
      weight: w(30, 20, 100),
      locked: true,
      why: "Morning, fasted, after the toilet, same scale; lowered by the day before. It also weighs the weigh-in in the trend (E4).",
    },
    {
      key: "pace",
      weight: w(40, 25, 55),
      why: "The 7-day trend's slope against the goal's, within 0.25–1 % a week.",
    },
    {
      key: "consistency",
      weight: w(30, 10, 40),
      why: "Valid weigh-ins in the last 7 days. The number itself is never judged.",
    },
  ],
  sources: ["Thomas 2014", "Helms 2014", "Zheng 2015"],
};

export const WATER: ScoringModel = {
  id: "water",
  domain: "hydration",
  version: 1,
  date: DATE,
  parts: [
    {
      key: "expected",
      weight: w(50, 30, 70),
      why: "The day's need (E10) spread over the waking hours, against what was drunk by now.",
    },
    {
      key: "afterTraining",
      weight: w(30, 10, 40),
      why: "1.25–1.5 × the estimated sweat within 2 h.",
    },
    {
      key: "spread",
      weight: w(20, 0, 30),
      why: "Small doses, and little in the 2 h before bed.",
    },
  ],
  sources: ["EFSA 2010", "ACSM 2007", "Shirreffs 1996"],
};

export const REGISTRY: readonly ScoringModel[] = [FOOD, SLEEP, SESSION, WEIGHING, WATER];

/** Declared in the spec with parts but no weights yet: listed so the score's page can say so. */
export const PENDING = ["dayTargets", "distribution", "recovery", "habits"] as const;
