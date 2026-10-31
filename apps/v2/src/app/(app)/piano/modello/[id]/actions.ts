"use server";
/**
 * Piano's day model editor (dossiers/day-templates.md slice b): each form's
 * server action. The session's owner, the id and the fields checked, then
 * core/plans; every write is `ownedBy` the owner there.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, logicalDay } from "@/core/engines/time";
import {
  createModel,
  duplicateModel,
  historyShares,
  inheritedTargets,
  readModelBook,
  readRoleDays,
  removeBlock,
  resolveModel,
  restoreBlock,
  saveBlock,
  saveModel,
  setModelActive,
  setWeekdays,
  toModels,
} from "@/core/plans";
import { readBlock, readTargets } from "@/features/plan/model-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FormState = { errors: Record<string, string>; n: number; saved?: boolean };

const fields = (data: FormData) => {
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  return form;
};
const done = () => revalidatePath("/", "layout");

/** Name, base and targets. */
export async function saveModelForm(
  id: string,
  prev: FormState,
  data: FormData,
): Promise<FormState> {
  if (!UUID.test(id)) return { errors: { name: "Modello non trovato." }, n: prev.n + 1 };
  const owner = await requireOwner();
  const db = await getDb();
  const form = fields(data);
  const name = (form["name"] ?? "").trim();
  const extendsId = UUID.test(form["base"] ?? "") ? form["base"]! : null;
  const { models } = await readModelBook(db, owner);
  // What it would inherit from the base chosen now.
  const inherited = extendsId ? inheritedTargets(extendsId, models).targets : null;
  const { targets, errors } = readTargets(form, inherited);
  if (name === "") errors["name"] = "Dagli un nome, per esempio «Lavoro».";
  else if (models.some((m) => m.id !== id && m.name.toLowerCase() === name.toLowerCase()))
    errors["name"] = "Hai già un modello con questo nome.";
  if (Object.keys(errors).length) return { errors, n: prev.n + 1 };
  if (!(await saveModel(db, owner, id, { name, extendsId, targets })))
    return {
      errors: { base: "Questa base creerebbe un giro: scegline un’altra." },
      n: prev.n + 1,
    };
  done();
  return { errors: {}, n: prev.n + 1, saved: true };
}

/** One target back to the base's («torna alla base»). */
export async function resetTarget(id: string, key: string): Promise<void> {
  if (!UUID.test(id) || !/^[a-zA-Z]+$/.test(key)) return;
  const owner = await requireOwner();
  const db = await getDb();
  const { models } = await readModelBook(db, owner);
  const m = models.find((x) => x.id === id);
  if (!m?.targets || !(key in m.targets)) return;
  const { [key]: _gone, ...rest } = m.targets;
  await saveModel(db, owner, id, {
    name: m.name,
    extendsId: m.extendsId,
    targets: Object.keys(rest).length ? rest : null,
  });
  done();
}

/** A block added (no «blockId» in the form) or changed. */
export async function saveBlockForm(
  id: string,
  prev: FormState,
  data: FormData,
): Promise<FormState> {
  const asked = String(data.get("blockId") ?? "");
  const blockId = asked === "" ? null : asked;
  if (!UUID.test(id) || (blockId !== null && !UUID.test(blockId)))
    return { errors: { kind: "Blocco non trovato." }, n: prev.n + 1 };
  const read = readBlock(fields(data));
  if (!read.ok) return { errors: read.errors, n: prev.n + 1 };
  const ok = await saveBlock(
    await getDb(),
    await requireOwner(),
    id,
    blockId,
    read.block,
  );
  if (!ok) return { errors: { kind: "Blocco non trovato." }, n: prev.n + 1 };
  done();
  return { errors: {}, n: prev.n + 1, saved: true };
}

export async function removeBlockForm(id: string, blockId: string): Promise<void> {
  if (!UUID.test(id) || !UUID.test(blockId)) return;
  await removeBlock(await getDb(), await requireOwner(), id, blockId);
  done();
}

export async function restoreBlockForm(id: string, baseBlockId: string): Promise<void> {
  if (!UUID.test(id) || !UUID.test(baseBlockId)) return;
  await restoreBlock(await getDb(), await requireOwner(), id, baseBlockId);
  done();
}

/**
 * «Quote dalle tue ultime 4 settimane» (§9.3): each meal block takes its
 * role's share from the person's days; a role eaten on at least a third of
 * them and with no block gets one, without a time.
 */
export async function sharesFromHistory(id: string): Promise<void> {
  if (!UUID.test(id)) return;
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  const [book, rows] = await Promise.all([
    readModelBook(db, owner),
    readRoleDays(db, owner, addDays(today, -28), addDays(today, -1), known),
  ]);
  const model = resolveModel(id, toModels(book.models, book.rows));
  if (!model) return;
  const shares = historyShares(rows);
  const most = Math.max(0, ...Object.values(shares).map((s) => s.days));
  for (const [role, s] of Object.entries(shares)) {
    const block = model.blocks.find(
      (b) => b.kind === "meal" && b.defaults?.["role"] === role,
    );
    if (!block && s.days < most / 3) continue;
    await saveBlock(db, owner, id, block?.id ?? null, {
      kind: "meal",
      role,
      // A block keeps its own time; a new one takes the role's usual time.
      atMin: block ? (block.when.type === "at" ? block.when.min : s.atMin) : s.atMin,
      durationMin: null,
      kcalShare: s.kcal.toFixed(3),
      proteinShare: s.protein.toFixed(3),
    });
  }
  done();
}

export async function weekdaysForm(id: string, data: FormData): Promise<void> {
  if (!UUID.test(id)) return;
  const days = data
    .getAll("weekday")
    .map(Number)
    .filter((d) => Number.isInteger(d));
  await setWeekdays(await getDb(), await requireOwner(), id, days);
  done();
}

export async function archiveForm(id: string, active: boolean): Promise<void> {
  if (!UUID.test(id)) return;
  await setModelActive(await getDb(), await requireOwner(), id, active);
  done();
}

/** «Duplica»: the same model under a new name; «Estendi»: a new model built on this one. */
export async function copyForm(id: string, how: "duplicate" | "extend"): Promise<void> {
  if (!UUID.test(id)) return;
  const owner = await requireOwner();
  const db = await getDb();
  const { models } = await readModelBook(db, owner);
  const m = models.find((x) => x.id === id);
  if (!m) return;
  const free = (n: string) => {
    let name = n;
    for (let i = 2; models.some((x) => x.name.toLowerCase() === name.toLowerCase()); i++)
      name = n + " " + i;
    return name;
  };
  const made =
    how === "duplicate"
      ? await duplicateModel(db, owner, id, free(m.name + " (copia)"))
      : await createModel(db, owner, free(m.name + " +"), id);
  done();
  if (made) redirect("/piano/modello/" + made);
}

/** «Nuovo modello» from Modelli. */
export async function newModel(data: FormData): Promise<void> {
  const owner = await requireOwner();
  const db = await getDb();
  const { models } = await readModelBook(db, owner);
  let name = String(data.get("name") ?? "").trim() || "Nuova giornata";
  for (let i = 2; models.some((x) => x.name.toLowerCase() === name.toLowerCase()); i++)
    name = (String(data.get("name") ?? "").trim() || "Nuova giornata") + " " + i;
  const base = String(data.get("base") ?? "");
  const id = await createModel(
    db,
    owner,
    name,
    models.some((m) => m.id === base) ? base : null,
  );
  done();
  redirect("/piano/modello/" + id);
}
