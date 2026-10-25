/**
 * features/plan/from-day.ts — Oggi's «Salva come modello»
 * (dossiers/day-templates.md §6): a day as a day model's blocks. Each meal
 * role becomes one meal block at its first meal's time, with its share of
 * the day's kcal and protein (several dinners are one dinner block); each
 * session a session block at its time, with its minutes. Planned and done
 * entries both count: a day planned ahead is a model too. A role with no
 * energy (a coffee logged as a snack) gives no block. Pure.
 */
import type { DayItem } from "@/core/day";
import { lineTotals } from "@/core/food/totals";
import type { BlockInput } from "@/core/plans";

const ROLES = ["breakfast", "lunch", "snack", "dinner"];

export function blocksFromDay(items: readonly DayItem[]): BlockInput[] {
  const live = items.filter((i) => i.status === "done" || i.status === "planned");
  const meals = live.filter(
    (i) => i.kind.key === "meal" && i.subcategory && ROLES.includes(i.subcategory),
  );
  const sum = (i: DayItem) => {
    const t = lineTotals(
      i.lines,
      typeof i.values["servings"] === "string" ? i.values["servings"] : null,
    );
    return { kcal: Number(t["kcal"] ?? 0), protein: Number(t["protein"] ?? 0) };
  };
  const byRole = new Map<
    string,
    { atMin: number | null; kcal: number; protein: number }
  >();
  for (const m of meals) {
    const s = sum(m);
    const r = byRole.get(m.subcategory!) ?? { atMin: null, kcal: 0, protein: 0 };
    const at = m.minute !== null && m.minute >= 0 && m.minute < 1440 ? m.minute : null;
    byRole.set(m.subcategory!, {
      atMin: r.atMin === null ? at : at === null ? r.atMin : Math.min(r.atMin, at),
      kcal: r.kcal + s.kcal,
      protein: r.protein + s.protein,
    });
  }
  const kcal = [...byRole.values()].reduce((a, r) => a + r.kcal, 0);
  const protein = [...byRole.values()].reduce((a, r) => a + r.protein, 0);
  const share = (v: number, of: number) => (of > 0 ? (v / of).toFixed(3) : null);
  const blocks: BlockInput[] = ROLES.flatMap((role) => {
    const r = byRole.get(role);
    // A coffee logged as a snack is not a meal block.
    return r && r.kcal > 0
      ? [
          {
            kind: "meal" as const,
            role,
            atMin: r.atMin,
            durationMin: null,
            kcalShare: share(r.kcal, kcal),
            proteinShare: share(r.protein, protein),
          },
        ]
      : [];
  });
  for (const s of live.filter((i) => i.kind.key === "session")) {
    const span = s.start && s.end ? (s.end.getTime() - s.start.getTime()) / 60_000 : null;
    const minutes = Number(s.values["durationMin"]) || span;
    blocks.push({
      kind: "session",
      role: null,
      atMin: s.minute !== null && s.minute >= 0 && s.minute < 1440 ? s.minute : null,
      durationMin: minutes ? Math.round(minutes) : null,
      kcalShare: null,
      proteinShare: null,
    });
  }
  return blocks.sort((a, b) => (a.atMin ?? 9999) - (b.atMin ?? 9999));
}
