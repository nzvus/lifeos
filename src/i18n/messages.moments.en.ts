/**
 * i18n/messages.moments.en.ts — the moments of the day (ADR-0011, ADR-0044).
 */
export const momentsEn = {
  label: "Moment",
  hint: "Prefilled from the meal's category or the time; you can change it.",
  none: "No moment",
  categoryLabel: "Category",
  categoryNone: "— none",
  categoryHint: "Optional: suggests the moment when you add it to a day.",
  all: "All",
  subtotal: "{v} kcal",
  names: {
    breakfast: "Breakfast",
    lunch: "Lunch",
    snack: "Snack",
    dinner: "Dinner",
    pre_workout: "Before training",
    post_workout: "After training",
    pre_sleep: "Before sleep",
  },
  /** A snack's group, by when it falls (core/nutrition/moments snackPart). */
  snackParts: {
    night: "Night snack",
    morning: "Mid-morning snack",
    afternoon: "Afternoon snack",
    evening: "Evening snack",
  },
};

/** A day type's program (ADR-0044). */
export const dayProgramEn = {
  title: "Program",
  hint: "When you train and eat on this kind of day. Slots give the day its places and times; the shares are soft hints.",
  trainingAt: "Usual training time",
  trainingHint: "Empty = no training on this kind of day.",
  shift: "Shift in a check-in week (kcal)",
  shiftHint: "+ on heavy days, − on light ones: the week's total stays the same.",
  slots: "Meal slots",
  kind: "Moment",
  at: "Time",
  kcalShare: "kcal %",
  proteinShare: "Protein %",
  add: "Add a slot",
  remove: "Remove this slot",
  starter: "Start from",
  starterNone: "— choose a template",
  starters: {
    rest: "Rest day",
    gymMorning: "Gym day (morning)",
    gymEvening: "Gym day (evening)",
    longCardio: "Long cardio",
  },
  total: "Total: {kcal} % of kcal · {protein} % of protein",
  empty: "No slots: the day shows as before.",
  save: "Save program",
  goalOverrides:
    "You have a goal in Settings: the deficit, protein and fat here apply only without one.",
};
