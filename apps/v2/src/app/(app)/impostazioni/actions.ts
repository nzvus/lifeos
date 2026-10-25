"use server";
/** Saving the settings (V-14): the session's owner, the form checked by core, then saved. */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { checkSettings, saveSettings, type SettingsInput } from "@/core/account/settings";
import { redirect } from "next/navigation";
import { savePlace } from "@/core/account/place";
import { geocodeUrl, readGeocode } from "@/core/engines/environment";
import type { SettingsState } from "@/features/account/SettingsForm";

const WORDS: Record<keyof SettingsInput, Record<"invalid" | "range", string>> = {
  sex: { invalid: "Scegli una delle due.", range: "Scegli una delle due." },
  birthYear: {
    invalid: "Scrivi l’anno, per esempio 1998.",
    range: "Serve un anno da adulti.",
  },
  heightCm: {
    invalid: "Scrivi i centimetri, per esempio 178.",
    range: "Tra 100 e 250 cm.",
  },
  timeZone: { invalid: "Un fuso come Europe/Rome.", range: "Un fuso come Europe/Rome." },
  boundary: { invalid: "Un’ora come 04:00.", range: "Prima di mezzogiorno." },
};

export async function saveSettingsForm(
  prev: SettingsState,
  data: FormData,
): Promise<SettingsState> {
  const owner = await requireOwner();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const checked = checkSettings(
    {
      sex: form["sex"] ?? "",
      birthYear: form["birthYear"] ?? "",
      heightCm: form["heightCm"] ?? "",
      timeZone: form["timeZone"] ?? "",
      boundary: form["boundary"] ?? "",
    },
    new Date().getUTCFullYear(),
  );
  if (!checked.ok) {
    const errors: Record<string, string> = {};
    for (const [k, code] of Object.entries(checked.errors))
      if (code) errors[k] = WORDS[k as keyof SettingsInput][code];
    return { errors, values: form, saved: false, n: prev.n + 1 };
  }
  await saveSettings(await getDb(), owner, checked.profile);
  revalidatePath("/", "layout");
  return { errors: {}, values: form, saved: true, n: prev.n + 1 };
}

/** «Il tempo»: the city, found by Open-Meteo's geocoder; empty takes it out. */
export async function savePlaceForm(data: FormData): Promise<void> {
  const owner = await requireOwner();
  const city = String(data.get("city") ?? "")
    .trim()
    .slice(0, 80);
  if (city === "") {
    await savePlace(await getDb(), owner, null);
    revalidatePath("/", "layout");
    redirect("/impostazioni");
  }
  let place = null;
  try {
    const r = await fetch(geocodeUrl(city), { signal: AbortSignal.timeout(4000) });
    place = r.ok ? readGeocode(await r.json()) : null;
  } catch {
    place = null;
  }
  if (!place) redirect("/impostazioni?luogo=nontrovato");
  await savePlace(await getDb(), owner, place);
  revalidatePath("/", "layout");
  redirect("/impostazioni?luogo=ok");
}
