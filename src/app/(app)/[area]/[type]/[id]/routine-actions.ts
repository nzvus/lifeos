"use server";
/**
 * A scheda made or composed again (PAT-62, PAT-16; change 2026-11-07-exercise-scheda): its
 * name through `core/verbs` (create, startFrom, edit), its exercises in order through
 * `core/training` (`setRoutineExercises`), then its page. What was typed comes back on a refusal.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readOrder } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setRoutineExercises } from "@/core/training";
import { act, undo } from "@/core/verbs";
import type { RoutineState } from "@/features/training/RoutineComposer";
import { training } from "@/i18n/training";

const E = training.routine.errors;

/** `id`: compose that scheda again; `from`: a new one starting from it («Parti da»). */
export async function saveRoutine(
  mode: { id?: string; from?: string },
  prev: RoutineState,
  data: FormData,
): Promise<RoutineState> {
  const owner = await requireOwner();
  const db = await getDb();
  const name = String(data.get("name") ?? "").trim();
  const order = readOrder((k) =>
    typeof data.get(k) === "string" ? String(data.get(k)) : null,
  );
  const again = (errors: Record<string, string>): RoutineState => ({
    errors,
    name,
    order,
    n: prev.n + 1,
  });
  if (!name) return again({ name: E.name });
  if (order.length === 0) return again({ lines: E.lines });
  const made = mode.id
    ? await act(db, owner, "edit", "routine", mode.id, { name })
    : mode.from
      ? await act(db, owner, "startFrom", "routine", mode.from, { name })
      : await act(db, owner, "create", "routine", null, { name });
  if (!made.ok)
    return again(
      made.refused === "name_taken"
        ? { name: E.taken }
        : made.refused === "not_found"
          ? { form: E.gone }
          : { name: E.name },
    );
  const done = await setRoutineExercises(db, owner, made.id, order);
  if (done !== "ok") {
    // A new scheda with none of his exercises is not kept.
    if (!mode.id && made.undo) await undo(db, owner, made.undo);
    return again(done === "gone" ? { form: E.gone } : { lines: E.lines });
  }
  revalidatePath("/", "layout");
  redirect("/corpo/scheda/" + made.id);
}
