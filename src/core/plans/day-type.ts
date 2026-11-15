/**
 * «Salva come giornata tipo» (proposal §28, his «yc» on Q1 (a), 15 Nov): a ciclo's step is a
 * giornata tipo — its blocchi «nel ciclo» are its lines, each with its own time and of any type
 * (Q-18 (a); `dayBlocks` plans them on the step's days). This writes a day's voci into the step
 * due that day: each voce becomes a blocco «nel ciclo» holding what it is of (a pasto, a scheda,
 * a tragitto, else its type) at its time. What the step already holds is skipped, and one object
 * or type is one line (eight glasses of water are one «Acqua»).
 */
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogParts,
  catalogValues,
  cycleStepItems,
  cycleSteps,
} from "../db/schema";
import { localParts } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { blockSeedOf, type BlockSeed } from "./blocks";
import { blockNames, IN_CYCLE, inCycleBlockOf, inCycleBlocks } from "./cycles-repo";

/** «08:30»: how a blocco's `at` is stored (`blockWhen` reads it back). */
const hhmm = (min: number) =>
  String(Math.floor(min / 60) % 24).padStart(2, "0") +
  ":" +
  String(min % 60).padStart(2, "0");

/** A line's identity: its object, else its type and category. */
const whatKey = (w: BlockSeed["what"]) =>
  "items" in w
    ? "item:" + w.items.map((i) => i.id).join(",")
    : "kind:" + w.kind + ":" + (w.defaults?.["category"] ?? "");

export async function saveDayToStep(
  db: Db,
  owner: Owner,
  p: {
    cycleId: string;
    position: number;
    /** The day's voci, in order of time. */
    voceIds: readonly string[];
    timeZone: string;
    /** A type's word, for a line of a type («Acqua»); an object's line takes its name. */
    nameOf: (kind: string) => string;
    /** The area of a type, for its line (blocco `area`, required). */
    areaOf: (kind: string) => string;
    /** A voce held as an object made for it (a meal of foods saved as a pasto), by voce id. */
    objects?: ReadonlyMap<string, { id: string; name: string }>;
    /** The step's name as shown («Legs»): a step named by what it held keeps it. */
    label?: string;
  },
): Promise<{ added: number } | "gone"> {
  const seeds = (
    await Promise.all(
      p.voceIds.map(async (id) => {
        const seed = await blockSeedOf(db, owner, id);
        const made = p.objects?.get(id);
        return seed && made
          ? {
              ...seed,
              name: made.name,
              what: { items: [{ id: made.id, quantity: null }] },
            }
          : seed;
      }),
    )
  ).filter((s): s is BlockSeed => s !== null);
  return db.transaction(async (tx) => {
    const [step] = await tx
      .select({ id: cycleSteps.id, label: cycleSteps.label })
      .from(cycleSteps)
      .where(
        and(
          ownedBy(cycleSteps, owner),
          eq(cycleSteps.cycleId, p.cycleId),
          eq(cycleSteps.position, p.position),
        ),
      );
    if (!step) return "gone";
    // Named by what it held («Legs»), it would take the new lines' names: it keeps its own.
    if (step.label === "" && p.label)
      await tx
        .update(cycleSteps)
        .set({ label: p.label })
        .where(and(ownedBy(cycleSteps, owner), eq(cycleSteps.id, step.id)));
    // A step holding its scheda directly (as his older cicli do) would stop planning it once
    // it holds blocchi (PL-30): the scheda goes into its blocco «nel ciclo» first, as the
    // ciclo's editor does (Q-18 (a)).
    const direct = await tx
      .select({ position: cycleStepItems.position, itemId: cycleStepItems.itemId })
      .from(cycleStepItems)
      .where(and(ownedBy(cycleStepItems, owner), eq(cycleStepItems.stepId, step.id)));
    const blocks = await inCycleBlocks(
      tx,
      owner,
      direct.map((d) => d.itemId),
    );
    for (const d of direct.filter((x) => !blocks.has(x.itemId))) {
      const [r] = await tx
        .select({ id: catalogItems.id, name: catalogItems.name })
        .from(catalogItems)
        .where(
          and(
            ownedBy(catalogItems, owner),
            eq(catalogItems.id, d.itemId),
            eq(catalogItems.catalog, "routine"),
          ),
        );
      if (!r) continue;
      const blockId = await inCycleBlockOf(tx, owner, { id: r.id, name: r.name });
      await tx
        .update(cycleStepItems)
        .set({ itemId: blockId })
        .where(
          and(
            ownedBy(cycleStepItems, owner),
            eq(cycleStepItems.stepId, step.id),
            eq(cycleStepItems.position, d.position),
          ),
        );
    }
    // What the step holds now: its blocchi and what each is of.
    const held = await tx
      .select({ itemId: cycleStepItems.itemId, position: cycleStepItems.position })
      .from(cycleStepItems)
      .where(and(ownedBy(cycleStepItems, owner), eq(cycleStepItems.stepId, step.id)));
    const heldIds = held.map((h) => h.itemId);
    const [parts, values] = heldIds.length
      ? await Promise.all([
          tx
            .select({ itemId: catalogParts.itemId, partItemId: catalogParts.partItemId })
            .from(catalogParts)
            .where(
              and(ownedBy(catalogParts, owner), inArray(catalogParts.itemId, heldIds)),
            ),
          tx
            .select({
              itemId: catalogValues.itemId,
              field: catalogValues.field,
              text: catalogValues.text,
            })
            .from(catalogValues)
            .where(
              and(
                ownedBy(catalogValues, owner),
                inArray(catalogValues.itemId, heldIds),
                inArray(catalogValues.field, ["kind", "defaults"]),
              ),
            ),
        ])
      : [[], []];
    const seen = new Set<string>();
    for (const id of heldIds) {
      const objs = parts.filter((x) => x.itemId === id).map((x) => x.partItemId);
      if (objs.length) seen.add("item:" + objs.join(","));
      // A blocco holding a scheda alone also covers the scheda itself (the step's session).
      for (const o of objs) seen.add("item:" + o);
      const kind = values.find((v) => v.itemId === id && v.field === "kind")?.text;
      if (kind) {
        const d = values.find((v) => v.itemId === id && v.field === "defaults")?.text;
        const cat = d ? (JSON.parse(d) as Record<string, string>)["category"] : undefined;
        seen.add("kind:" + kind + ":" + (cat ?? ""));
      }
    }
    const names = await blockNames(tx, owner);
    let position = held.reduce((m, h) => Math.max(m, h.position + 1), 0);
    let added = 0;
    for (const s of seeds) {
      const k = whatKey(s.what);
      if (seen.has(k)) continue;
      seen.add(k);
      // Names stay unique (PAT-24): «Colazione (Legs)», then «(Legs 2)».
      const base = s.name ?? p.nameOf(s.kind);
      const tag = step.label || "giornata";
      let name = base;
      for (let n = 1; names.has(name.toLowerCase()); n++)
        name = base + (n === 1 ? ` (${tag})` : ` (${tag} ${n})`);
      names.add(name.toLowerCase());
      const [row] = await tx
        .insert(catalogItems)
        .values({ userId: owner.id, catalog: "block", name })
        .returning({ id: catalogItems.id });
      const id = row!.id;
      const at = s.startAt ? localParts(s.startAt, p.timeZone).minute : null;
      await tx.insert(catalogValues).values([
        { userId: owner.id, itemId: id, field: "area", text: p.areaOf(s.kind) },
        { userId: owner.id, itemId: id, field: "recurrence", text: IN_CYCLE },
        ...(at === null
          ? []
          : [
              { userId: owner.id, itemId: id, field: "when", text: "time" },
              { userId: owner.id, itemId: id, field: "at", text: hhmm(at) },
            ]),
        ...("kind" in s.what
          ? [
              { userId: owner.id, itemId: id, field: "kind", text: s.what.kind },
              ...(s.what.defaults && Object.keys(s.what.defaults).length
                ? [
                    {
                      userId: owner.id,
                      itemId: id,
                      field: "defaults",
                      text: JSON.stringify(s.what.defaults),
                    },
                  ]
                : []),
            ]
          : []),
      ]);
      if ("items" in s.what)
        await tx.insert(catalogParts).values(
          s.what.items.map((x, i) => ({
            userId: owner.id,
            itemId: id,
            position: i,
            partItemId: x.id,
            quantity: x.quantity === null ? null : String(x.quantity),
          })),
        );
      await tx
        .insert(cycleStepItems)
        .values({ userId: owner.id, stepId: step.id, position: position++, itemId: id });
      added++;
    }
    return { added };
  });
}
