/**
 * The signals (MOD-01, reframe §14; his 20 Nov): a level that changes over time, typed, measured or
 * derived from voci, drawn as a lane beside the rail (VIS-64). A registry entry like a type, so a
 * new one gets its lane with no new drawing. Their rows are `docs/spec/orca/objects.md` OBJ-46…50.
 */
import type { KindClass } from "./kind";

export type Signal = {
  key: string;
  /** His word for it. */
  name: string;
  class: KindClass | null;
  /** Derived from voci (with their keys), typed by him, or read from outside. */
  source: { derived: readonly string[] } | "typed" | "read";
};

export const SIGNALS: readonly Signal[] = [
  // FD-61: Σ dose × ½^(h/5 h), from what he took.
  {
    key: "caffeine_left",
    name: "caffeina rimasta",
    class: null,
    source: { derived: ["intake"] },
  },
  // FD-63: the stores filling with each dose and draining each day.
  {
    key: "creatine_stores",
    name: "scorte di creatina",
    class: null,
    source: { derived: ["intake"] },
  },
  // reframe §12: windows moving · on one's feet · seated, from passi, tragitti, sessioni and his quanta.
  {
    key: "movement",
    name: "movimento",
    class: null,
    source: { derived: ["steps", "trip", "session"] },
  },
  // BD-61, VIS-75: read live, never stored.
  { key: "weather", name: "meteo", class: "context", source: "read" },
  // VIS-61: the sun and moon of his city.
  { key: "daylight", name: "luce del giorno", class: "context", source: "read" },
];
