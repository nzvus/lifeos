"use server";
/** «Come valutiamo»: the person's weights for a model, kept within its ranges (E7 `editWeights`). */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { saveWeights } from "@/core/account/weights";
import { editWeights, REGISTRY } from "@/core/engines/judgements";
import { logicalDay } from "@/core/engines/time";

export async function saveWeightsForm(modelId: string, data: FormData): Promise<void> {
  const model = REGISTRY.find((m) => m.id === modelId);
  if (!model) return;
  const asked: Record<string, number> = {};
  for (const p of model.parts) {
    const v = Number(data.get(p.key));
    if (Number.isFinite(v)) asked[p.key] = v;
  }
  const { clock } = await ownerClock();
  const { weights } = editWeights(model, asked, logicalDay(new Date(), clock));
  await saveWeights(await getDb(), await requireOwner(), model.id, weights);
  revalidatePath("/", "layout");
  redirect("/andamento/come-valutiamo?modello=" + model.id);
}

export async function resetWeights(modelId: string): Promise<void> {
  if (!REGISTRY.some((m) => m.id === modelId)) return;
  await saveWeights(await getDb(), await requireOwner(), modelId, null);
  revalidatePath("/", "layout");
  redirect("/andamento/come-valutiamo?modello=" + modelId);
}
