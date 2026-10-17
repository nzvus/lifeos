/**
 * calendar.ts — the week and the month around a date, computed, never typed
 * (kit.md §6: the boards once showed 15 October 2026 as a Wednesday).
 * ISO dates in, ISO dates out; Monday first.
 */
const iso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
};
const out = (t: Date) => t.toISOString().slice(0, 10);

export function addDays(s: string, n: number): string {
  const t = iso(s);
  t.setUTCDate(t.getUTCDate() + n);
  return out(t);
}

/** Monday … Sunday of the week holding `s`. */
export function weekOf(s: string): string[] {
  const monday = addDays(s, -((iso(s).getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Every day of the month holding `s`, and how many blank cells come before the 1st. */
export function monthOf(s: string): { lead: number; days: string[] } {
  const t = iso(s);
  const first = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  const days: string[] = [];
  for (let d = first; d.getUTCMonth() === t.getUTCMonth(); d = iso(addDays(out(d), 1)))
    days.push(out(d));
  return { lead: (first.getUTCDay() + 6) % 7, days };
}
