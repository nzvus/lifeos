/**
 * core/nutrition/moments.ts — the moments of the day an entry belongs to
 * (ADR-0011). A closed list, like locales and themes: labels live in i18n/,
 * icons in ui/. A meal may carry one as its category (a hint); a log entry
 * stores its own (what happened).
 */
export const MOMENTS = ["breakfast", "lunch", "snack", "dinner"] as const;
export type Moment = (typeof MOMENTS)[number];

export function isMoment(s: string): s is Moment {
  return (MOMENTS as readonly string[]).includes(s);
}
