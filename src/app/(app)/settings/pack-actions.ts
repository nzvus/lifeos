/**
 * app/(app)/settings/pack-actions.ts — Settings → Packs (ADR-0034): add the
 * starter pack, or a pack from a file, to my account. Adds only what is
 * missing (core/catalog/apply.ts); the file is untrusted, so it is size
 * capped, parsed and validated before anything is written.
 */
"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { applyPack, type ApplyReport } from "@/core/catalog/apply";
import { parsePack, type Pack } from "@/core/catalog/pack";
import { starterPack } from "@/core/catalog/starter";
import { todayIn } from "@/core/shared/dates";

export type PackState =
  | { status: "idle" }
  | {
      status: "error";
      problem: "notJson" | "tooBig" | "invalid" | "isExport";
      field?: string;
    }
  | { status: "done"; report: ApplyReport };

const MAX_BYTES = 2 * 1024 * 1024;

async function apply(pack: Pack): Promise<PackState> {
  const { owner, settings } = await requireContext();
  const report = await applyPack(getDb(), owner, pack, todayIn(settings.timezone));
  revalidatePath("/", "layout");
  return { status: "done", report };
}

export async function addStarterAction(): Promise<PackState> {
  return apply(starterPack());
}

export async function importPackAction(
  _prev: PackState,
  formData: FormData,
): Promise<PackState> {
  await requireContext(); // signed in before reading anything
  const file = formData.get("pack");
  if (!(file instanceof File) || file.size === 0)
    return { status: "error", problem: "invalid", field: "_form" };
  if (file.size > MAX_BYTES) return { status: "error", problem: "tooBig" };
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    return { status: "error", problem: "notJson" };
  }
  // 2026-10-09: an export loaded here only said "not a valid pack (field
  // format)". It is restored by the replace runbook, not by Settings.
  if ((json as { format?: unknown } | null)?.format === "lifeos-export")
    return { status: "error", problem: "isExport" };
  const pack = parsePack(json);
  if (!pack.ok)
    return { status: "error", problem: "invalid", field: Object.keys(pack.errors)[0] };
  return apply(pack.value);
}
