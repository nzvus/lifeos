/** An «assunzione»'s dose in words (FOOD-44), for server pages and the «Al volo» row. */
import { F } from "@lifeos/kit";

/** «1 capsula» when the dose has a name, else the amount («3 g»). */
export const doseWords = (dose: string, unit: string, name: string | null): string =>
  name ? "1 " + name : F.num(Number(dose), unit);
