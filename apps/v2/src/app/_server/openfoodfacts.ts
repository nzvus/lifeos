/**
 * app/_server/openfoodfacts.ts — one product from Open Food Facts by
 * barcode (free, open data; as v1). The User-Agent names the app, as OFF
 * asks; nothing about the person is sent. Parsing is pure (core/food/off).
 */
import "server-only";
import { isValidGtin } from "@/core/food/barcode";
import { OFF_FIELDS, offPrefill, type OffPrefill } from "@/core/food/off";

export async function fetchOff(code: string): Promise<OffPrefill | null> {
  if (!isValidGtin(code)) return null;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`,
      {
        headers: { "User-Agent": "Lifeos/0.2 (personal nutrition app)" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 }, // the same code again today: no new request
      },
    );
    if (!res.ok) return null;
    return offPrefill(code, await res.json());
  } catch {
    return null; // offline, slow or blocked: the form stays empty
  }
}
