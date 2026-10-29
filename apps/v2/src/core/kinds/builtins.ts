/**
 * core/kinds/builtins.ts — the built-in kinds (kinds.md), as data checked by
 * `kindSchema`. Field keys are the ones the converter writes into
 * `entry_values` (core/convert/facts.ts), so a converted day reads with no
 * mapping. Kinds the converter does not produce yet are added with the
 * slice that enters them (water, activity, reading, nap come with the day).
 */
import { MEAL_SESSION } from "../engines/time";
import type { KindInput } from "./kind";

/** The four meal roles; v1's pre/post-workout and pre-sleep are relations in v2 (migration.md). */
export const MEAL_ROLES = ["breakfast", "lunch", "snack", "dinner"] as const;
export type MealRole = (typeof MEAL_ROLES)[number];

const bodyFields: KindInput["fields"] = [
  { key: "bodyFatPct", type: "number", unit: "%", min: 2, max: 70 },
  { key: "waistCm", type: "number", unit: "cm", min: 30, max: 250 },
  { key: "hipCm", type: "number", unit: "cm", min: 30, max: 250 },
  { key: "neckCm", type: "number", unit: "cm", min: 15, max: 80 },
  { key: "abdomenCm", type: "number", unit: "cm", min: 30, max: 250 },
];
const scale5 = (key: string) => ({ key, type: "scale" as const, scale: 5 as const });

export const BUILTIN_KINDS: readonly KindInput[] = [
  // Food and drink.
  {
    key: "meal",
    family: "food",
    domain: "food",
    shape: "instant",
    entry: "specialised",
    composite: { lines: "food" },
    subcategory: { field: "role" },
    fields: [
      { key: "role", type: "choice", choices: [...MEAL_ROLES] },
      // Chosen by the person, or taken from the time (capture.md §4).
      { key: "roleSource", type: "choice", choices: ["manual", "auto"] },
      { key: "servings", type: "number", min: 0 },
      { key: "label", type: "text" },
      { key: "estimated", type: "boolean" },
      { key: "leftOut", type: "boolean" },
    ],
    relations: [{ to: "session", bands: MEAL_SESSION.bands }],
  },
  {
    key: "batch",
    family: "food",
    domain: "food",
    shape: "instant",
    entry: "specialised",
    composite: { lines: "food" },
    fields: [
      { key: "portions", type: "number", min: 0 },
      { key: "label", type: "text" },
    ],
  },
  {
    key: "water",
    family: "drink",
    domain: "food",
    shape: "instant",
    entry: "quick",
    subcategory: "water",
    fields: [
      { key: "ml", type: "integer", unit: "ml", min: 1, max: 5000, required: true },
    ],
  },
  // Training and movement.
  {
    key: "session",
    family: "train",
    domain: "training",
    shape: "interval",
    entry: "specialised",
    composite: { children: "session_exercise" },
    fields: [
      { key: "durationMin", type: "duration", unit: "min", min: 0 },
      { key: "intensity", type: "text" },
      { key: "kcalEstimate", type: "number", unit: "kcal", min: 0 },
      // Effort of the whole session, 0–10 (session RPE; activity.md §4).
      { key: "rpe", type: "integer", min: 0, max: 10 },
      { key: "label", type: "text" },
      { key: "muscleGroups", type: "text" },
    ],
  },
  {
    key: "session_exercise",
    family: "train",
    domain: "training",
    shape: "interval",
    entry: "specialised",
    child: true,
    fields: [
      { key: "position", type: "integer", min: 0 },
      { key: "restS", type: "duration", unit: "s", min: 0 },
    ],
  },
  // A trip along a route of the library (dossiers/movement.md, slice 1): on foot, by bike or
  // by transport; its walking part feeds the day's steps later (E3), when trips have data.
  {
    key: "trip",
    family: "train",
    domain: "training",
    shape: "interval",
    entry: "specialised",
    subcategory: { field: "mode" },
    fields: [
      { key: "route", type: "ref", catalog: "route" },
      {
        key: "mode",
        type: "choice",
        choices: ["walk", "run", "bike", "bus", "train", "car", "mixed"],
      },
      { key: "distanceKm", type: "number", unit: "km", min: 0, max: 1000 },
      { key: "walkingM", type: "integer", unit: "m", min: 0, max: 100000 },
    ],
  },
  {
    key: "steps",
    family: "train",
    domain: "training",
    shape: "instant",
    entry: "quick",
    subcategory: "steps",
    fields: [
      { key: "steps", type: "integer", min: 0, max: 100000 },
      { key: "walkingMin", type: "duration", unit: "min", min: 0 },
      { key: "level", type: "choice", choices: ["sitting", "mixed", "on_feet"] },
    ],
  },
  {
    key: "activity",
    family: "habit",
    domain: "work",
    shape: "interval",
    entry: "timer",
    subcategory: { field: "category" },
    fields: [
      {
        key: "category",
        type: "choice",
        required: true,
        choices: [
          "work",
          "study",
          "commute",
          "chores",
          "leisure",
          "social",
          "family",
          "screen",
        ],
      },
      { key: "project", type: "ref", catalog: "project" },
      scale5("focus"),
    ],
  },
  {
    key: "reading",
    family: "mind",
    domain: "work",
    shape: "interval",
    entry: "timer",
    fields: [
      { key: "book", type: "ref", catalog: "book" },
      { key: "pages", type: "integer", min: 0 },
    ],
  },
  // Body.
  {
    key: "weigh_in",
    family: "body",
    domain: "body",
    shape: "instant",
    entry: "quick",
    subcategory: "weight",
    fields: [
      {
        key: "weightKg",
        type: "number",
        unit: "kg",
        min: 20,
        max: 400,
        required: true,
      },
      ...bodyFields,
      { key: "fasted", type: "boolean" },
      { key: "afterToilet", type: "boolean" },
      { key: "afterTraining", type: "boolean" },
    ],
  },
  {
    key: "measurements",
    family: "body",
    domain: "body",
    shape: "instant",
    entry: "form",
    subcategory: "measure",
    fields: bodyFields,
  },
  // Sleep.
  {
    key: "sleep",
    family: "sleep",
    domain: "sleep",
    shape: "interval",
    entry: "form",
    anchor: "end",
    subcategory: "wake",
    fields: [
      scale5("quality"),
      // Only when v1's bed and wake did not make a span (converter): kept as typed.
      { key: "bedAt", type: "text" },
      { key: "wakeAt", type: "text" },
    ],
  },
  {
    key: "nap",
    family: "sleep",
    domain: "sleep",
    shape: "interval",
    entry: "timer",
    fields: [],
  },
  // Mind.
  {
    key: "checkin",
    family: "mind",
    domain: "mind",
    shape: "instant",
    entry: "quick",
    fields: [
      scale5("mood"),
      scale5("energy"),
      scale5("stress"),
      { key: "moment", type: "choice", choices: ["morning", "evening"] },
    ],
  },
  {
    key: "journal",
    family: "mind",
    domain: "mind",
    shape: "instant",
    entry: "form",
    fields: [],
  },
  // Money and home.
  {
    key: "movement",
    family: "money",
    domain: "money",
    shape: "instant",
    entry: "specialised",
    fields: [{ key: "tags", type: "text" }],
  },
  {
    key: "purchase",
    family: "money",
    domain: "home",
    shape: "instant",
    entry: "form",
    fields: [
      { key: "packages", type: "number", min: 0 },
      // What it brought in, in the food's unit (packages × the format's size): the Dispensa's «in».
      { key: "quantity", type: "number", min: 0 },
      { key: "priceCents", type: "integer", unit: "cents", min: 0 },
      { key: "shop", type: "text" },
    ],
  },
  {
    key: "stock_count",
    family: "money",
    domain: "home",
    shape: "instant",
    entry: "quick",
    fields: [{ key: "quantity", type: "number", min: 0 }],
  },
  {
    key: "chore",
    family: "habit",
    domain: "home",
    shape: "instant",
    entry: "quick",
    fields: [],
  },
];
