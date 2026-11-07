/**
 * The words of a cibo's and a pasto's sections on the generic object page (PAT-04, PAT-30;
 * change 2026-11-07-food-meal) and of their create forms. PAT-81, PAT-93.
 */
import { F } from "@lifeos/kit";

export const food = {
  per100: (unit: string) => `valori per 100 ${unit}`,
  uses: (n: number) =>
    n > 0
      ? "usato " + F.plural(n, "volta", "volte") + " in 90 giorni"
      : "non usato negli ultimi 90 giorni",
  score: {
    title: "Voto per 100 kcal",
    meta: "tocca per le parti: densità di nutrienti e limiti, sugli obiettivi di oggi",
  },
  look: {
    title: "Così appare",
    meta: (unit: string) => `100 ${unit}: macro, tipi, vitamine e minerali`,
    micros: (unit: string) => `stime · in 100 ${unit}, su quanto serve al giorno`,
  },
  brands: {
    title: "Marche",
    none: "Nessuna marca: si registra il cibo.",
    list: "Le marche",
    add: "+ Marca",
    uses: (n: number) => F.plural(n, "volta", "volte") + " in 90 giorni",
    mean: (count: number, spread: string) =>
      `Media di ${count} marche, pesata su quanto mangi ciascuna${spread}.`,
    uncertain: " Le marche sono molto diverse: nei pasti conviene scegliere quella vera.",
  },
  home: {
    title: "In casa",
    box: "Dispensa",
    open: "Apri la dispensa",
    hint: "Segna quando lo compri: quello che mangi lo toglie la dispensa da sola.",
    bought: "Comprato",
    boughtNow: "Comprato adesso",
    counted: "Ne ho…",
    save: "Salva",
    quantity: "Quanto in tutto",
    packages: "Confezioni",
    price: "Prezzo",
    shop: "Negozio",
    left: "Quanto ne hai adesso",
    leftHelp: "Da adesso conta questo: utile se hai buttato o dimenticato qualcosa.",
    errors: {
      quantity: "Quanto hai comprato, per esempio 1000.",
      packages: "Le confezioni, per esempio 2.",
      price: "Il prezzo in euro, per esempio 3,98.",
      left: "Quanto ne hai, per esempio 500 (0 se è finito).",
    } as Record<string, string>,
  },
  usedIn: {
    none: "In nessun pasto salvato.",
  },
} as const;
