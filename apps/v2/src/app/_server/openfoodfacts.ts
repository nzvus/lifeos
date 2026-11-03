/**
 * app/_server/openfoodfacts.ts — one product from Open Food Facts by
 * barcode (free, open data; as v1). The User-Agent names the app, as OFF
 * asks; nothing about the person is sent. Parsing is pure (core/food/off).
 * «Not there» (OFF answers 404 or status 0) is told apart from «no answer»
 * (offline, slow, an error): the page says one or the other (FOOD-43).
 */
import "server-only";
import { isValidGtin } from "@/core/food/barcode";
import { OFF_FIELDS, offPrefill, type OffPrefill } from "@/core/food/off";

export type OffLookup =
  { status: "found"; prefill: OffPrefill } | { status: "missing" } | { status: "error" };

export async function fetchOff(code: string): Promise<OffLookup> {
  if (!isValidGtin(code)) return { status: "missing" };
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`,
      {
        headers: { "User-Agent": "Lifeos/0.2 (personal nutrition app)" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 }, // the same code again today: no new request
      },
    );
    if (res.status === 404) return { status: "missing" };
    if (!res.ok) return { status: "error" };
    const prefill = offPrefill(code, await res.json());
    return prefill ? { status: "found", prefill } : { status: "missing" };
  } catch {
    return { status: "error" }; // offline, slow or blocked: say so, the form stays empty
  }
}
