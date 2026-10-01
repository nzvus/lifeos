/**
 * app/_server/openfoodfacts.ts — reads one product from Open Food Facts by
 * barcode (free, open data; 15 product reads per minute per IP). The app's
 * User-Agent names the app, as OFF asks; no user data is sent. Parsing is
 * pure, in core/nutrition/off.ts.
 */
import "server-only";
import { OFF_FIELDS, offPrefill, type OffPrefill } from "@/core/nutrition/off";

export function isBarcode(code: string): boolean {
  return /^\d{6,14}$/.test(code);
}

export async function fetchOff(code: string): Promise<OffPrefill | null> {
  if (!isBarcode(code)) return null;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`,
      {
        headers: { "User-Agent": "Lifeos/0.1 (personal nutrition app)" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 }, // the same code again today: no new request
      },
    );
    if (!res.ok) return null;
    return offPrefill(code, await res.json());
  } catch {
    return null; // offline, slow, or blocked: the form stays empty
  }
}
