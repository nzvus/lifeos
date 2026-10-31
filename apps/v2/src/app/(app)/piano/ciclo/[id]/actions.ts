"use server";
/**
 * Piano's «Ciclo» editor (dossiers/day-templates.md slice c): each form's
 * server action. The session's owner, the arguments checked, then
 * core/plans; every write is `ownedBy` the owner there.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { addStep, createCycle, moveStep, readCycleBook, saveCycle } from "@/core/plans";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export type CycleFormState = {
  errors: Record<string, string>;
  n: number;
  saved?: boolean;
};

const done = () => revalidatePath("/", "layout");

export async function saveCycleForm(
  id: string,
  prev: CycleFormState,
  data: FormData,
): Promise<CycleFormState> {
  const again = (errors: Record<string, string>) => ({ errors, n: prev.n + 1 });
  if (!UUID.test(id)) return again({ name: "Ciclo non trovato." });
  const name = String(data.get("name") ?? "").trim();
  const start = String(data.get("start") ?? "");
  const errors: Record<string, string> = {};
  if (name === "") errors["name"] = "Dagli un nome, per esempio «PPL».";
  if (!ISO.test(start)) errors["start"] = "Il giorno da cui parte.";
  if (Object.keys(errors).length) return again(errors);
  const owner = await requireOwner();
  const db = await getDb();
  const { cycles } = await readCycleBook(db, owner);
  if (cycles.some((c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase()))
    return again({ name: "Hai già un ciclo con questo nome." });
  const ok = await saveCycle(db, owner, id, {
    name,
    start,
    active: data.get("active") !== "paused",
    advance: data.get("advance") === "date" ? "date" : "occurrence",
    onSkip: data.get("onSkip") === "shift" ? "shift" : "lose",
  });
  if (!ok) return again({ name: "Ciclo non trovato." });
  done();
  return { errors: {}, n: prev.n + 1, saved: true };
}

/** «+ sessione» (a routine from the form) or «+ riposo» (none). */
export async function addStepForm(id: string, data: FormData): Promise<void> {
  if (!UUID.test(id)) return;
  const routine = String(data.get("routine") ?? "");
  await addStep(
    await getDb(),
    await requireOwner(),
    id,
    UUID.test(routine) ? routine : null,
  );
  done();
}

export async function moveStepForm(
  id: string,
  stepId: string,
  by: -1 | 0 | 1,
): Promise<void> {
  if (!UUID.test(id) || !UUID.test(stepId) || ![-1, 0, 1].includes(by)) return;
  await moveStep(await getDb(), await requireOwner(), id, stepId, by);
  done();
}

/** «Nuovo ciclo» from Modelli: from today, empty. */
export async function newCycle(data: FormData): Promise<void> {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const { cycles } = await readCycleBook(db, owner);
  const asked = String(data.get("name") ?? "").trim() || "Nuovo ciclo";
  let name = asked;
  for (let i = 2; cycles.some((c) => c.name.toLowerCase() === name.toLowerCase()); i++)
    name = asked + " " + i;
  const id = await createCycle(db, owner, name, logicalDay(new Date(), clock));
  done();
  redirect("/piano/ciclo/" + id);
}
