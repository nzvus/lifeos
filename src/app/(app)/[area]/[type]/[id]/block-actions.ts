"use server";
/**
 * What a blocco holds, saved from its Composer (PL-01…03): the posted lines — objects with
 * servings, or one type (`kind:<key>`) — through `core/plans` `setBlockWhat`, then its page.
 * A refusal comes back with the lines as posted and its words.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readLines } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setBlockWhat } from "@/core/plans";
import type { BlockLine, BlockState } from "@/features/plan/BlockComposer";
import { whatOf } from "@/features/plan/block-keys";
import { plan } from "@/i18n/plan";

const E = plan.block.errors;

export async function saveBlockWhat(
  id: string,
  options: Readonly<Record<string, { name: string; meta: string; fam: string }>>,
  prev: BlockState,
  data: FormData,
): Promise<BlockState> {
  const get = (k: string) =>
    typeof data.get(k) === "string" ? String(data.get(k)) : null;
  const { lines, errors } = readLines(get);
  const posted: BlockLine[] = [];
  for (let i = 0; get(`line.${i}.key`) !== null; i++) {
    const key = get(`line.${i}.key`)!;
    posted.push({
      key,
      quantity: get(`line.${i}`) ?? "1",
      ...(options[key] ?? { name: key, meta: "", fam: "day" }),
    });
  }
  const again = (e: Record<string, string>): BlockState => ({
    errors: e,
    lines: posted,
    n: prev.n + 1,
  });
  if (Object.keys(errors).length) return again(errors);
  const what = whatOf(lines);
  if (!what) return again({ lines: lines.length ? E.mixed : plan.block.nothing });
  const done = await setBlockWhat(await getDb(), await requireOwner(), id, what);
  if (done !== "ok") return again({ form: done === "gone" ? E.gone : E.invalid });
  revalidatePath("/", "layout");
  redirect("/oggi/blocco/" + id);
}
