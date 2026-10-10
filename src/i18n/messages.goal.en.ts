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
  hint: "Say what you want and, if you like, a target weight and a day. The app plans how fast, within the ranges that keep muscle; dynamic day types follow it, and a weekly check-in fixes the next 7 days.",
  none: "No goal yet: dynamic day types use their own deficit.",
  kind: "What for",
  kinds: {
    lose: "Lose fat",
    gain: "Build muscle",
    recomp: "Recomposition (less fat, more muscle)",
    maintain: "Maintain",
  },
  kindsShort: {
    lose: "Fat loss",
    gain: "Muscle gain",
    recomp: "Recomposition",
    maintain: "Maintenance",
  },
  targetKg: "Target weight (kg, optional)",
  targetKgHint:
    "Optional. To lose 3 kg of fat, your weight minus 3. Protein is per kg of it.",
  targetDay: "By (optional)",
  targetDayHint: "Empty = at the recommended pace.",
  planTitle: "The plan",
  planNoWeight: "Add a weigh-in to see the plan.",
  planRate:
    "{rate} % of your weight a week: about {kg} kg a week, {kcal} kcal a day {dir} what you spend.",
  planBelow: "below",
  planAbove: "above",
  planOptimal: "Within the recommended range ({low}–{high} % a week).",
  planFastLose:
    "Too fast for that day: the most that keeps muscle is {high} % a week. At that pace you get there around {day}.",
  planFastGain:
    "Too fast for that day: above {high} % a week the gain is mostly fat. At that pace you get there around {day}.",
  planSlow:
    "Slower than it could be, which is fine: the recommended range is {low}–{high} % a week.",
  planWhen: "At this pace you reach {kg} kg around {day}.",
  planReached: "Target reached: eat at maintenance, or set a new goal.",
  planRecomp:
    "Eat what you spend, with protein high: fat goes down and muscle up slowly, the scale barely moves. Training is what drives it. Give a lower target weight to lose fat slowly as well (0.25–0.5 % a week).",
  planMaintain: "Eat what you spend.",
  planUpdates: "Each weekly check-in plans the pace again from your weight trend.",
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
  weeklyCheckIn: "Weekly check-in",
  weeklyCheckInHint:
    "Off: each day follows the goal on its own, as it comes. On: once a week the app proposes the next 7 days from what you really spent, and you accept or skip; an accepted week stays fixed.",
  undo: "Undo the check-in",
  undone: "Check-in undone: the days follow the goal again",
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
  lineGoal: "{rate} % a week",
  lineCheckin: "week fixed at the check-in",
  checkinTitle: "Weekly check-in",
  checkinSpend:
    "You spend ~{kcal} kcal a day on average (the last 7 days, training included)",
  checkinWas: "(last check-in {kcal})",
  checkinLearnt: "Learnt from your log and scale.",
  checkinModel: "Estimated by the model: not learnt from your data yet.",
  checkinTarget: "Next 7 days, each day: {kcal} kcal",
  checkinShifted: "Next 7 days, {kcal} kcal on average; your day programs shift it:",
  checkinMacros: "protein {protein} g · fat {fat} g · carbs {carbs} g",
  checkinFloored: "Held at your calorie floor.",
  checkinFactor: "Accepting also sets everyday activity to {factor}.",
  checkinMissing: "Body data or a weigh-in is missing: no proposal yet.",
  accept: "Accept",
  skip: "Skip this week",
  accepted: "Week fixed: {kcal} kcal a day",
  skipped: "Skipped: days follow the goal",
};
