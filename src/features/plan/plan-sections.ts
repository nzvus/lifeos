/**
 * features/plan/plan-sections.ts — his giornate tipo and cicli as the kit `Elenco`'s sections
 * (PL-70, PAT-43, PAT-03; proposal §30): each step of a ciclo with its lines, then the cicli
 * with «+ Nuovo ciclo»; a blocco outside every ciclo only while one exists. Pure.
 */
import { readRecurrence, recurrenceText, type ElencoSection } from "@lifeos/kit";
import type { BlockListRow, CycleRow } from "@/core/plans";
import { plan } from "@/i18n/plan";

const p = plan.elenco;

export function planSections(p0: {
  blocks: readonly BlockListRow[];
  cycles: readonly CycleRow[] | null;
  archived: boolean;
  /** The area's name («Corpo»), or null for every area (Oggi). */
  area: string | null;
}): ElencoSection[] {
  // His «yc» on Q1 (a), 15 Nov (proposal §28–§30): no «Blocchi» any more. A giornata tipo is a
  // ciclo's step with its lines; a blocco outside every ciclo shows only while one exists.
  const loose = p0.blocks.filter(
    (b) =>
      (p0.area === null || b.area === p0.area) &&
      readRecurrence(b.recurrence)?.type !== "inCycle",
  );
  const looseSection: ElencoSection[] = loose.length
    ? [
        {
          key: "fuori",
          title: p.loose,
          rows: loose.map((b) => ({
            id: b.id,
            name: b.name,
            href: "/oggi/blocco/" + b.id,
            meta: [
              p0.area === null ? b.area : null,
              recurrenceText(readRecurrence(b.recurrence)),
            ]
              .filter(Boolean)
              .join(" · "),
          })),
          empty: "",
        },
      ]
    : [];
  if (p0.cycles === null) return looseSection;
  const live = p0.cycles.filter((c) => c.active !== p0.archived);
  return [
    {
      key: "giornate",
      title: p.dayTypes,
      rows: live.flatMap((c) =>
        c.steps
          .filter((st) => st.items.length > 0)
          .map((st) => ({
            id: st.id,
            name: st.label || st.items.map((i) => i.name).join(" + "),
            href: "/oggi/ciclo/" + c.id,
            meta: c.name + " · " + p.lines(st.items.length),
          })),
      ),
      empty: p0.archived ? p.emptyArchived : p.emptyDayTypes,
    },
    ...looseSection,
    {
      key: "cicli",
      title: p.cycles,
      rows: live.map((c) => ({
        id: c.id,
        name: c.name,
        href: "/oggi/ciclo/" + c.id,
        meta: p.steps(c.steps.length),
      })),
      add: { label: p.addCycle, href: "/oggi/ciclo/nuovo" },
      empty: p0.archived ? p.emptyArchived : p.emptyCycles,
    },
  ];
}
