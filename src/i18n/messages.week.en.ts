/**
 * i18n/messages.week.en.ts — a day read in its week (ADR-0047).
 */
export const weekEn = {
  title: "This week",
  info: "How it is read",
  infoNote:
    "Energy is a weekly quantity: a big day can be balanced over the next ones, at most 30 % a day, so a binge is never paid back by fasting. Protein counts day by day. Fibre, salt, sugars and saturated fat matter as an average. Days with nothing logged don't count.",
  balanceOver: "The days before: {kcal} kcal over their targets ({n} logged).",
  balanceUnder: "The days before: {kcal} kcal under their targets ({n} logged).",
  balanceEven: "The days before are on target ({n} logged).",
  adjusted:
    "To bring the week back, if you like: about {adjusted} kcal today instead of {target}.",
  capped:
    "Held at a limit (30 % of the day's target, or your BMR): the rest is left to go.",
  protein: "Protein in the good zone: {in} of {of} days.",
  average: "{name}: {avg} on average (target {target})",
  irregular: "The days swing a lot this week: steadier days are easier to keep.",
  nothing: "Nothing logged before this day this week.",
  watchOver: "This week: {name} above target",
  watchUnder: "This week: {name} below target",
};
