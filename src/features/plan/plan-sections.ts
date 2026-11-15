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
  // One place per idea (his 15 Nov: «non mi piace per nulla che ci sia sopra e sotto… ripetitivi»):
  // a ciclo is one row, its giornate tipo in order as its words; no second list of the steps.
  const stepName = (st: CycleRow["steps"][number]) =>
    st.label || st.items.map((i) => i.name).join(" + ") || p.rest;
  return [
    ...looseSection,
    {
      key: "cicli",
      title: p.cycles,
      rows: live.map((c) => ({
        id: c.id,
        name: c.name,
        href: "/oggi/ciclo/" + c.id,
        meta: c.steps.map(stepName).join(" → "),
      })),
      add: { label: p.addCycle, href: "/oggi/ciclo/nuovo" },
      empty: p0.archived ? p.emptyArchived : p.emptyCycles,
    },
  ];
}
