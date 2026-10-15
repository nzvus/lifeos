/**
 * core/export/areas.ts — the exported tables grouped by area of the app, for
 * what a person reads: a replace's summary, the merge's report, the CSV's
 * folders (ADR-0052). `lead` are the tables a summary counts ("112
 * ingredients, 19 meals"); the others ride along. Every exported table is in
 * exactly one area (areas.test.ts).
 */
export const AREAS = {
  food: {
    lead: ["ingredients", "meals"],
    tables: [
      "ingredients",
      "tags",
      "ingredient_tags",
      "ingredient_compounds",
      "meals",
      "meal_items",
      "rating_factors",
      "meal_ratings",
    ],
  },
  log: {
    lead: ["log_entries", "day_closures"],
    tables: ["log_entries", "log_entry_items", "log_entry_left_out", "day_closures"],
  },
  targets: {
    lead: ["day_profiles", "goals", "week_checkins"],
    tables: [
      "day_profiles",
      "day_programs",
      "day_program_slots",
      "day_plans",
      "goals",
      "week_checkins",
      "week_checkin_days",
      "energy_corrections",
    ],
  },
  training: {
    lead: ["training_sessions", "exercises", "routines", "programs"],
    tables: [
      "exercises",
      "routines",
      "routine_items",
      "programs",
      "program_slots",
      "program_slot_exercises",
      "program_slot_items",
      "program_skips",
      "program_overrides",
      "training_sessions",
      "session_exercises",
      "sets",
    ],
  },
  body: {
    lead: ["body_measurements", "sleep_logs", "day_activity"],
    tables: ["body_measurements", "weigh_in_context", "sleep_logs", "day_activity"],
  },
  mind: { lead: ["day_checkins"], tables: ["day_checkins"] },
  pantry: {
    lead: ["products", "purchases", "batches"],
    tables: [
      "products",
      "purchases",
      "stock_counts",
      "batches",
      "batch_lines",
      "reminders",
    ],
  },
  money: {
    lead: ["money_movements", "money_receipts"],
    tables: [
      "money_categories",
      "money_movements",
      "money_lines",
      "money_receipts",
      "receipt_aliases",
    ],
  },
  assistant: {
    lead: ["assistant_conversations"],
    tables: ["assistant_conversations", "assistant_messages"],
  },
  settings: { lead: ["user_settings"], tables: ["user_settings"] },
} as const satisfies Record<
  string,
  { lead: readonly string[]; tables: readonly string[] }
>;

export type Area = keyof typeof AREAS;
export const AREA_KEYS = Object.keys(AREAS) as Area[];

const areaOf = new Map<string, Area>(
  AREA_KEYS.flatMap((a) => AREAS[a].tables.map((t) => [t, a] as const)),
);

/** The area a table belongs to. */
export function tableArea(table: string): Area {
  return areaOf.get(table)!;
}
