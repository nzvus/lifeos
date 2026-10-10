/**
 * i18n/messages.goal.en.ts — what you spend, learnt (ADR-0041/0042), the goal and
 * the weekly check-in (ADR-0043); split out of messages.home.en.ts.
 */
export const calibrationEn = {
  title: "Calibration",
  how: "Learns from the last {days} days at once: what you ate and how your weight moved tell what you really spend. Recent weeks count more.",
  fewWeighIns: "Needs at least 6 weigh-ins over 2 weeks (now {n}).",
  fewLogged: "Needs at least 14 complete days, and half of the days (now {n} of {of}).",
  expenditure: "You spend",
  expenditureValue: "{mid} kcal a day ({low}–{high})",
  learnt: "Learnt from {weeks} weeks · everyday activity {factor} ± {sigma}",
  unsure:
    "Not sure enough yet to propose a change (± {sigma}); more weigh-ins and logged days narrow it.",
  incomplete:
    "{n} days logged under 60 % of what they cost were taken as half-logged and filled in from the days around them.",
  closed:
    "{n} days closed by you: they count fully (complete) or are not read as a deficit (something missing). Close the day from its chip on Today.",
  estimates:
    "{share} % of what you logged was estimates (meals out, typed totals): they count less.",
  estimateFactor: "Your estimates look like × {k} (± {sigma}) of what you really eat.",
  intake: "Eaten on average",
  trend: "Weight trend",
  trendValue: "{kg} kg a week",
  observed: "Spent, by the scale",
  estimated: "Spent, by the model",
  fits: "The model fits your data (everyday activity {now}).",
  proposal: "Proposal: everyday activity {factor} (now {now}).",
  accept: "Accept",
  accepted: "Everyday activity now {factor}",
  reset: "Back to ×1.00 (now {now})",
  wasReset: "Calibration reset",
  withCheckin: "A new factor is accepted with the weekly check-in.",
};

export const weightGoalEn = {
  title: "Goal",
  hint: "How fast your weight should change, as % of it a week. Dynamic day types follow it; a weekly check-in proposes the next 7 days and fixes them, the same each day.",
  none: "No goal yet: dynamic day types use their own deficit.",
  rate: "Rate (% of weight a week)",
  rateHint:
    "Negative = lose, positive = gain. Fat loss −0.5 to −1; recomposition 0; lean gain +0.1 to +0.25.",
  targetKg: "Target weight (kg, optional)",
  targetKgHint: "Protein is per kg of it; empty = your current weight.",
  floor: "Calorie floor",
  floors: { standard: "Standard (your BMR)", low: "Low (1,200 kcal)" },
  protein: "Protein",
  proteins: {
    low: "Low (1.6 g/kg)",
    moderate: "Moderate (1.8 g/kg)",
    high: "High (2.0 g/kg)",
    extra: "Extra (2.2 g/kg)",
  },
  split: "Diet split",
  splits: {
    balanced: "Balanced (fat 25 %)",
    low_fat: "Low fat (fat 20 %)",
    low_carb: "Low carb (fat 35 %)",
  },
  weekday: "Check-in day",
  weekdays: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  changed:
    "A change applies to days not fixed by a check-in; the week already fixed keeps its numbers.",
  lineGoal: "Goal {rate} % a week",
  lineCheckin: "Week fixed at the check-in",
  checkinTitle: "Weekly check-in",
  checkinSpend: "You spend ~{kcal} kcal a day",
  checkinWas: "(last check-in {kcal})",
  checkinLearnt: "Learnt from your log and scale.",
  checkinModel: "Estimated by the model: not learnt from your data yet.",
  checkinTarget: "Next 7 days, each day: {kcal} kcal",
  checkinMacros: "protein {protein} g · fat {fat} g · carbs {carbs} g",
  checkinFloored: "Held at your calorie floor.",
  checkinFactor: "Accepting also sets everyday activity to {factor}.",
  checkinMissing: "Body data or a weigh-in is missing: no proposal yet.",
  accept: "Accept",
  skip: "Skip this week",
  accepted: "Week fixed: {kcal} kcal a day",
  skipped: "Skipped: days follow the goal",
};
