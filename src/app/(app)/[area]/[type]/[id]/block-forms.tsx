/**
 * A blocco's forms (PAT-04, PAT-11, PAT-62; change 2026-11-07-piano): `/oggi/blocco/nuovo` — its
 * name, area, when and how often (the generated form, «Rispetto a» his other blocchi), then on
 * to what it holds — and `/oggi/blocco/<id>/componi`, what it holds on the kit `Composer`.
 */
import { notFound } from "next/navigation";
import { F } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readUserKinds } from "@/core/day";
import { enterable } from "@/core/entries";
import { isoWeekday, localParts } from "@/core/engines/time";
import { kindRegistry } from "@/core/kinds";
import { catalogType, typeOfItem } from "@/core/kinds/catalog";
import { BLOCK_OBJECTS, blockSeedOf, readBlockWhat } from "@/core/plans";
import { listObjects, readObject } from "@/core/verbs";
import { ACTIVITY, NAMES } from "@/features/day/words";
import { AREA_NAME, areaOf } from "@/features/places";
import { NewObjectForm } from "@/features/objects/NewObjectForm";
import { newFields } from "@/features/objects/present";
import { BlockComposer, type BlockOption } from "@/features/plan/BlockComposer";
import { KIND_KEY } from "@/features/plan/block-keys";
import { plan } from "@/i18n/plan";
import { objectCreate } from "./actions";
import { createBlockFromVoce, saveBlockWhat } from "./block-actions";
import type { NewFormRender } from "./new-forms";
import { readRefs } from "./refs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * «Ripeti» (PL-44, `?voce=<id>`): the form starts from the voce — its object's name (or its
 * type's), its area, its time, its weekday — and the blocco holds the voce's object or type.
 */
async function fromVoce(id: string) {
  const owner = await requireOwner();
  const db = await getDb();
  const [seed, { clock }, kinds] = await Promise.all([
    blockSeedOf(db, owner, id),
    ownerClock(),
    readUserKinds(db, owner),
  ]);
  if (!seed) return null;
  const k = kindRegistry(kinds).get(seed.kind);
  const area = areaOf(k.domain);
  return {
    // Its object's name, else its category's word («Studio»), else its type's.
    name:
      seed.name ??
      ACTIVITY[("kind" in seed.what && seed.what.defaults?.["category"]) || ""] ??
      NAMES[seed.kind] ??
      k.name ??
      seed.kind,
    area: area ? AREA_NAME[area] : "Oggi",
    ...(seed.startAt
      ? { when: "time", at: F.time(localParts(seed.startAt, clock.timeZone).minute) }
      : {}),
    recurrence: JSON.stringify({ type: "weekdays", days: [isoWeekday(seed.day)] }),
  };
}

export const newBlock: NewFormRender = async (back, query) => {
  const t = catalogType("block")!;
  const refs = await readRefs(await getDb(), await requireOwner(), t);
  const voce = query["voce"] && UUID.test(query["voce"]) ? query["voce"] : null;
  const seeded = voce ? await fromVoce(voce) : null;
  return (
    <NewObjectForm
      title={plan.block.newTitle}
      back={back}
      fam="day"
      fields={newFields(t, refs)}
      initial={seeded ?? { area: "Oggi", recurrence: '{"type":"daily"}' }}
      action={
        seeded && voce
          ? createBlockFromVoce.bind(null, voce)
          : objectCreate.bind(null, "block", "componi")
      }
    />
  );
};

/** His objects a blocco may hold (PL-01) and the types ⊕ enters, his trackers among them. */
async function options(
  db: Awaited<ReturnType<typeof getDb>>,
  owner: Awaited<ReturnType<typeof requireOwner>>,
) {
  const objects = (
    await Promise.all(
      BLOCK_OBJECTS.map(async (c) => {
        const t = typeOfItem(c);
        return t
          ? (await listObjects(db, owner, t.key)).map((o) => ({
              fam: t.hue,
              id: o.id,
              name: o.name,
              meta: t.name,
            }))
          : [];
      }),
    )
  ).flat();
  const live = (await readUserKinds(db, owner)).filter((k) => !k.archivedAt);
  const kinds = kindRegistry(live)
    .all.filter(enterable)
    .map((k) => ({
      id: KIND_KEY + k.key,
      name: NAMES[k.key] ?? k.name ?? k.key,
      meta: plan.block.kind,
      fam: "habit",
    }));
  return [...objects, ...kinds] satisfies BlockOption[];
}

export const composeBlock = async (id: string) => {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const [o, what, opts] = await Promise.all([
    readObject(db, owner, "block", id),
    readBlockWhat(db, owner, id),
    options(db, owner),
  ]);
  if (!o || !what) notFound();
  const byId = Object.fromEntries(
    opts.map((x) => [x.id, { name: x.name, meta: x.meta, fam: x.fam }]),
  );
  const initial = [
    ...what.items.map((x) => ({
      key: x.id,
      name: x.name,
      meta: typeOfItem(x.catalog)?.name ?? "",
      fam: typeOfItem(x.catalog)?.hue ?? "day",
      quantity: x.quantity ? String(Number(x.quantity)).replace(".", ",") : "1",
    })),
    ...(what.kind
      ? [
          {
            key: KIND_KEY + what.kind,
            quantity: "1",
            ...(byId[KIND_KEY + what.kind] ?? {
              name: what.kind,
              meta: plan.block.kind,
              fam: "habit",
            }),
          },
        ]
      : []),
  ];
  return (
    <BlockComposer
      title={o.name}
      back={{ label: o.name, href: "/oggi/blocco/" + id }}
      options={opts}
      initial={initial}
      hour={Math.floor(localParts(new Date(), clock.timeZone).minute / 60)}
      action={saveBlockWhat.bind(null, id, byId)}
    />
  );
};
