/**
 * features/plan/plan-sections.ts — his blocchi and cicli as the kit `Elenco`'s sections
 * (PL-70, PAT-43, PAT-03): one row each to its page, how often under a blocco, a ciclo's steps;
 * «+ Nuovo blocco» / «+ Nuovo ciclo» last. Oggi · Elenco shows every area's; an area's Piano
 * only its own blocchi (MOD-32), and the cicli in Corpo (the gym's) and Oggi. Pure.
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
  const blocks: ElencoSection = {
    key: "blocchi",
    title: p.blocks,
    rows: p0.blocks
      .filter((b) => p0.area === null || b.area === p0.area)
      .map((b) => ({
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
    add: { label: p.addBlock, href: "/oggi/blocco/nuovo" },
    empty: p0.archived ? p.emptyArchived : p.emptyBlocks,
  };
  if (p0.cycles === null) return [blocks];
  return [
    blocks,
    {
      key: "cicli",
      title: p.cycles,
      rows: p0.cycles
        .filter((c) => c.active !== p0.archived)
        .map((c) => ({
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
