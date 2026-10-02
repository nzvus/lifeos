/**
 * core/catalog/starter.ts — the STARTER pack (ADR-0034): what every new
 * account begins with — exercises with how-to notes, routines and programs
 * (./starter/training.ts), spices, herbs, condiments, sauces, toppings and a
 * few sauces made from them (./starter/food.ts). Reviewed like code; the
 * test checks it is a valid pack whose references all resolve.
 */
import { parsePack, type Pack, type PackInput } from "./pack";
import { STARTER_INGREDIENTS, STARTER_MEALS } from "./starter/food";
import { STARTER_PROGRAMS, STARTER_ROUTINES } from "./starter/plans";
import { STARTER_EXERCISES } from "./starter/training";

export const STARTER: PackInput = {
  format: "lifeos-pack",
  version: 1,
  name: "Lifeos starter",
  description:
    "Esercizi con le indicazioni su come farli, schede e programmi per iniziare; spezie, erbe, condimenti, salse e topping, e qualche salsa fatta con questi.",
  sources: [
    "USDA FoodData Central (SR Legacy), per 100 g",
    "CREA, Tabelle di composizione degli alimenti",
    "ACSM e NSCA: serie, ripetizioni e recuperi per forza e ipertrofia",
  ],
  exercises: STARTER_EXERCISES,
  routines: STARTER_ROUTINES,
  programs: STARTER_PROGRAMS,
  ingredients: STARTER_INGREDIENTS,
  meals: STARTER_MEALS,
};

let parsed: Pack | undefined;

/** The starter, validated once. A broken starter is a bug: it throws. */
export function starterPack(): Pack {
  if (!parsed) {
    const r = parsePack(STARTER);
    if (!r.ok) throw new Error(`starter pack is invalid: ${JSON.stringify(r.errors)}`);
    parsed = r.value;
  }
  return parsed;
}
