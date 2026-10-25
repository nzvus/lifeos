"use server";
/** «Nuovo tragitto»: the typed route checked (core/movement), written, back where it came from. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { checkRoute, createRoute, type RouteError } from "@/core/movement/routes";
import type { RouteState } from "@/features/library/RouteForm";

const WORDS: Record<RouteError, string> = {
  name: "Un nome di 2–60 caratteri, per esempio Casa → palestra.",
  mode: "Scegli come.",
  distanceKm: "I km, per esempio 1,4.",
  durationMin: "I minuti, per esempio 18.",
  walkingM: "I metri a piedi, per esempio 600.",
  mapsUrl: "Un link di Google Maps (maps.app.goo.gl o google.com/maps).",
};
const BACK = /^\/(aggiungi\/tragitto\?giorno=\d{4}-\d{2}-\d{2}|libreria\/tragitto)$/;

export async function saveRoute(
  back: string | null,
  prev: RouteState,
  data: FormData,
): Promise<RouteState> {
  const owner = await requireOwner();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const c = checkRoute({
    name: form["name"] ?? "",
    mode: form["mode"] ?? "",
    distanceKm: form["distanceKm"] ?? "",
    durationMin: form["durationMin"] ?? "",
    walkingM: form["walkingM"] ?? "",
    mapsUrl: form["mapsUrl"] ?? "",
  });
  if (!c.ok) return again(Object.fromEntries(c.errors.map((e) => [e, WORDS[e]])));
  const made = await createRoute(await getDb(), owner, c.route);
  if (made === "taken") return again({ name: "Hai già un tragitto con questo nome." });
  revalidatePath("/", "layout");
  redirect(back && BACK.test(back) ? back : "/libreria/tragitto");
}
