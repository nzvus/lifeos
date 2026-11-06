/**
 * The old tracker address `/andamento/{tracker}` (before map D): the tracker
 * now lives in its area's Andamento (architecture.md §10), found by the
 * built-in name or the kind's domain; the query is kept.
 */
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readUserKinds } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { trackerHref } from "@/features/places";

export default async function OldTracker({
  params,
  searchParams,
}: {
  params: Promise<{ tracker: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tracker } = await params;
  const owner = await requireOwner();
  const own = kindRegistry(await readUserKinds(await getDb(), owner)).all.find(
    (k) => k.key === tracker,
  );
  const q = new URLSearchParams(
    Object.entries(await searchParams).filter(
      (e): e is [string, string] => typeof e[1] === "string",
    ),
  ).toString();
  redirect(trackerHref(tracker, own?.domain) + (q ? "?" + q : ""));
}
