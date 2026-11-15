/**
 * features/day/block-items.ts — what the Piano still plans on a day (PL-40; change
 * 2026-11-07-piano): each blocco or ciclo step `core/plans` `dayBlocks` left (not yet covered by
 * a voce) as a previsto row «dal piano», each opening the flow that makes its voce — a pasto's
 * composer with it and its time, the gym for a scheda, a type's sheet with its category and
 * time, else the object's page. Today only from an hour ago on: a breakfast missed at 21:00 is
 * not a plan any more; one with no time stays, at the end of the day (PL-12). Pure.
 */
import { F, readRecurrence, recurrenceText, type BoxEntry } from "@lifeos/kit";
import type { PlanItem, PlannedBlock } from "@/core/plans";
import { plan } from "@/i18n/plan";

export type PlanRow = BoxEntry & { id: string; minute: number };

/** Where a row with no time sits: the end of the day (PL-12). */
const UNTIMED_AT = 1439;

/** The flow that makes the voce of an object, by the voce kind it makes. */
const LOG_FLOW: Record<
  string,
  (p: { day: string; id: string; at: string | null }) => string
> = {
  meal: ({ day, id, at }) =>
    "/aggiungi/pasto?giorno=" + day + "&pasto=" + id + (at ? "&ora=" + at : ""),
  session: () => "/palestra",
};

export function blockItems(p: {
  day: string;
  planned: readonly PlannedBlock[];
  /** The objects the blocchi and steps hold (name, catalog). */
  items: ReadonlyMap<string, PlanItem>;
  /** The minute now when the day is today; null for a day to come. */
  nowMinute: number | null;
  /** A voce kind's family (its drawing) and name: the kind registry's. */
  familyOf: (kind: string) => string;
  kindName: (kind: string) => string;
  /** An object's family and page (its catalog type's hue and address, PAT-04). */
  objectOf: (catalog: string, id: string) => { fam: string; href: string } | null;
  /** A ciclo's name by id, for the ritmo's tag («PPLCR · Legs», proposal §32). */
  cycleName?: (cycleId: string) => string | undefined;
}): PlanRow[] {
  const w = plan.day;
  return p.planned
    .filter(
      (b) => p.nowMinute === null || b.minute === null || b.minute >= p.nowMinute - 60,
    )
    .map((b) => {
      const minute = b.minute ?? UNTIMED_AT;
      const at = b.minute === null ? null : F.time(b.minute);
      const item = b.itemId ? p.items.get(b.itemId) : undefined;
      const object = item && b.itemId ? p.objectOf(item.catalog, b.itemId) : null;
      const name = b.step?.label ?? b.block?.name ?? "";
      const title = item?.name ?? (b.block?.kind ? b.block.name : name);
      const href =
        (b.itemId && LOG_FLOW[b.kind]?.({ day: p.day, id: b.itemId, at })) ??
        (b.block?.kind
          ? "/aggiungi/" +
            b.block.kind +
            "?giorno=" +
            p.day +
            (typeof b.block.defaults["category"] === "string"
              ? "&categoria=" + b.block.defaults["category"]
              : "") +
            (at ? "&ora=" + at : "")
          : (object?.href ?? "/oggi/piano?giorno=" + p.day));
      return {
        id: b.key,
        minute,
        fam: object?.fam ?? p.familyOf(b.kind),
        title,
        time: at ?? "—",
        // The ritmo it comes from, as a tag that opens it (his 15 Nov: «solo un tag… toccando
        // quel tag… puoi visualizzare e configurare»).
        pills: [
          b.step
            ? {
                t: [p.cycleName?.(b.step.cycleId), b.step.label]
                  .filter(Boolean)
                  .join(" · "),
                // the line and its time too: «Sposta questa volta» moves it (PL-43)
                href:
                  "/oggi/ciclo/" +
                  b.step.cycleId +
                  "?giorno=" +
                  p.day +
                  "&riga=" +
                  (b.block?.id ?? "step") +
                  (at ? "&ora=" + at : ""),
              }
            : b.block
              ? {
                  t:
                    recurrenceText(readRecurrence(JSON.stringify(b.block.recurrence))) ||
                    w.fromPlan,
                  href: "/oggi/blocco/" + b.block.id,
                }
              : { t: w.fromPlan },
        ],
        meta: [
          // The blocco's name when the row says its object («Cena» · MERLUZZO al sugo).
          item && b.block && b.block.name !== item.name ? b.block.name : "",
          b.block?.kind && !item ? p.kindName(b.block.kind) : "",
          b.durationMin ? F.num(b.durationMin, "min") : "",
        ]
          .filter(Boolean)
          .join(" · "),
        planned: true,
        href,
        hrefLabel: w.open(title),
      };
    });
}
