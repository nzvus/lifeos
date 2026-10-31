"use server";
/**
 * Piano's day sheet (the board Plan, dossiers/day-templates.md slice c): a
 * cycle's step chosen by hand for one day, or a rest, or back to the
 * cycle's own; «Copia ieri»; «Sposta l'allenamento». The model of the day
 * and «Salta» reuse Oggi's actions.
 */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ownerClock } from "@/app/_server/clock";
import { loadDay } from "@/core/day";
import { checkEntry, createEntry, moveEntry } from "@/core/entries";
import { addDays, instantAt, logicalDay } from "@/core/engines/time";
import { readFoodChoices } from "@/core/food/catalog";
import { copyLines } from "@/core/food/copy";
import { kindRegistry } from "@/core/kinds";
import { setCycleOverride } from "@/core/plans";
import { clockToDayMin } from "@/features/day/entry-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** «step»: "" back to the cycle's, "rest", or a step's position. */
export async function overrideStep(
  day: string,
  cycleId: string,
  data: FormData,
): Promise<void> {
  if (!ISO.test(day) || !UUID.test(cycleId)) return;
  const v = String(data.get("step") ?? "");
  const position = v === "" ? undefined : v === "rest" ? null : Number(v);
  if (typeof position === "number" && !(Number.isInteger(position) && position >= 0))
    return;
  await setCycleOverride(await getDb(), await requireOwner(), day, cycleId, position);
  revalidatePath("/", "layout");
  revalidatePath("/", "layout");
}

/**
 * «Copia ieri» (the board Plan): the day before's meals (not skipped, not
 * left out) as this day's planned meals, at the same time and role, with
 * today's catalog values (core/food `copyLines`). A role the day already has
 * is left as it is. The days to come and today only.
 */
export async function copyYesterday(day: string): Promise<void> {
  if (!ISO.test(day)) return;
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  if (day < today) return;
  const [before, target, choices] = await Promise.all([
    loadDay(db, owner, addDays(day, -1), known),
    loadDay(db, owner, day, known),
    readFoodChoices(db, owner, today),
  ]);
  const has = new Set(
    [...target.timed, ...target.untimed]
      .filter((i) => i.kind.key === "meal" && i.status !== "skipped")
      .map((i) => i.subcategory),
  );
  const byKey = new Map(choices.map((c) => [c.key, c]));
  const meal = kindRegistry().get("meal");
  for (const m of [...before.timed, ...before.untimed]) {
    if (m.kind.key !== "meal" || m.status === "skipped" || m.values["leftOut"] === true)
      continue;
    if (m.lines.length === 0 || (m.subcategory && has.has(m.subcategory))) continue;
    const text = (k: string) =>
      typeof m.values[k] === "string" ? (m.values[k] as string) : "";
    const checked = checkEntry(
      meal,
      {
        day,
        status: "planned",
        startMin: m.minute,
        endMin: null,
        values: { role: text("role"), servings: text("servings"), label: text("label") },
        note: "",
      },
      known.clock,
    );
    if (!checked.ok) continue;
    await createEntry(db, owner, {
      ...checked.entry,
      lines: copyLines(m.lines, byKey),
      itemId: m.item?.id ?? null,
    });
    if (m.subcategory) has.add(m.subcategory);
  }
  revalidatePath("/", "layout");
  revalidatePath("/", "layout");
}

/**
 * «Sposta l'allenamento»: the day's planned session at another time; with
 * none yet (the model's block), a planned session of the cycle's routine
 * at that time.
 */
export async function moveTraining(day: string, data: FormData): Promise<void> {
  if (!ISO.test(day)) return;
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const startMin = clockToDayMin(String(data.get("at") ?? ""), known.clock.boundaryMin);
  if (startMin === null) return;
  const entryId = String(data.get("entry") ?? "");
  const routine = String(data.get("routine") ?? "");
  const startAt = instantAt(day, startMin, known.clock);
  if (UUID.test(entryId)) {
    const minutes = Number(data.get("minutes") ?? 0);
    await moveEntry(
      db,
      owner,
      entryId,
      startAt,
      minutes > 0 ? new Date(startAt.getTime() + minutes * 60_000) : null,
    );
  } else {
    const checked = checkEntry(
      kindRegistry().get("session"),
      { day, status: "planned", startMin, endMin: null, values: {}, note: "" },
      known.clock,
    );
    if (!checked.ok) return;
    await createEntry(db, owner, {
      ...checked.entry,
      itemId: UUID.test(routine) ? routine : null,
    });
  }
  revalidatePath("/", "layout");
  revalidatePath("/", "layout");
}
