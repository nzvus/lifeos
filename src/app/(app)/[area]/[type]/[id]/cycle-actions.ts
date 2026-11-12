"use server";
/**
 * A ciclo's steps saved from its Composer (PAT-62 + «+ Riposo», Q-16 (a)): the posted keys in
 * order — a kept step's id, or `new.N.<blocco or scheda id>` / `new.N.rest` — through
 * `core/plans` `setCycleSteps`, then its page. A refusal comes back with the lines as posted.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readOrder } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readCycleBook, setCycleSteps, type StepRef } from "@/core/plans";
import type { CycleState, CycleStepLine } from "@/features/plan/CycleComposer";
import { stepOf } from "@/features/plan/cycle-keys";
import { plan } from "@/i18n/plan";
import { stepCandidates, stepMeta } from "./cycle-steps";

const E = plan.cycle.errors;
export async function saveCycleSteps(
  id: string,
  prev: CycleState,
  data: FormData,
): Promise<CycleState> {
  const owner = await requireOwner();
  const db = await getDb();
  const keys = readOrder((k) =>
    typeof data.get(k) === "string" ? String(data.get(k)) : null,
  );
  const refs = keys.map(stepOf);
  const order = refs.filter((x): x is StepRef => x !== null);
  const book = await readCycleBook(db, owner);
  const steps = new Map(
    (book.cycles.find((c) => c.id === id)?.steps ?? []).map((s) => [s.id, s]),
  );
  const candidates = new Map(stepCandidates(book).map((r) => [r.id, r]));
  const lines = keys.flatMap((key, i): CycleStepLine[] => {
    const o = refs[i];
    if (!o) return [];
    if ("step" in o) {
      const s = steps.get(o.step);
      return s
        ? [
            {
              key,
              itemId: s.items[0]?.id ?? null,
              label: s.items[0]?.name ?? s.label,
              meta: stepMeta(s.items[0]),
            },
          ]
        : [];
    }
    if ("item" in o) {
      const c = candidates.get(o.item);
      return [{ key, itemId: o.item, label: c?.name ?? "", meta: c?.meta }];
    }
    return [{ key, itemId: null, label: plan.cycle.rest }];
  });
  const again = (errors: Record<string, string>): CycleState => ({
    errors,
    lines,
    n: prev.n + 1,
  });
  if (order.length === 0) return again({ lines: E.lines });
  const done = await setCycleSteps(db, owner, id, order);
  if (done !== "ok") return again({ form: done === "gone" ? E.gone : E.invalid });
  revalidatePath("/", "layout");
  redirect("/oggi/ciclo/" + id);
}
