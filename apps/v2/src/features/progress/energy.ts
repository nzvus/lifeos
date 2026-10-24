/**
 * features/progress/energy.ts — Andamento's «Energia» (the Progress board;
 * dossiers/targets.md slice b): what E4 learnt the person spends, ± how
 * sure, from how many days, next to what the priors (E4a) say each part
 * costs — the gap between them is what the app learnt about this person.
 * Pure: the page passes the week's automatic decision as stored.
 */
import { F, type BoxEntry } from "@lifeos/kit";

type Priors = {
  bmr: number;
  everyday: number;
  steps: number;
  training: number;
  tef: number;
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function energyBoxes(
  week: Record<string, unknown> | null,
  monday: string,
): { learnt: BoxEntry; priors: BoxEntry[] } | null {
  if (!week || week["source"] !== "auto") return null;
  const E = num(week["expenditureKcal"]);
  if (E === null) return null;
  const sigma = num(week["sigmaKcal"]) ?? 0;
  const days = num(week["loggedDays"]) ?? 0;
  const p = (week["priors"] ?? null) as Priors | null;
  const sum = p ? p.bmr + p.everyday + p.steps + p.training + p.tef : null;
  const gap = sum === null ? null : E - sum;
  const learnt: BoxEntry = {
    fam: "body",
    sub: "measure",
    title: "Consumo appreso",
    value: F.n(E, 0) + " ± " + F.num(sigma, "kcal"),
    meta:
      "dal trend del peso e da ciò che hai mangiato in " +
      F.plural(days, "giorno", "giorni") +
      " fino al " +
      F.date(String(week["to"] ?? monday)) +
      (gap === null
        ? ""
        : " · le stime qui sotto fanno " +
          F.num(sum!, "kcal") +
          ": lo scarto è " +
          F.signed(Math.round(gap), "kcal")),
  };
  if (!p) return { learnt, priors: [] };
  const row = (
    fam: string,
    sub: string | undefined,
    title: string,
    v: number,
    meta: string,
  ): BoxEntry => ({
    fam,
    ...(sub ? { sub } : {}),
    title,
    value: (title.startsWith("Base") ? "" : "+") + F.num(v, "kcal"),
    meta,
  });
  return {
    learnt,
    priors: [
      row(
        "body",
        "weight",
        "Base (a riposo)",
        p.bmr,
        "Mifflin-St Jeor: peso, altezza, età",
      ),
      row(
        "day",
        undefined,
        "La giornata (seduto, in piedi)",
        p.everyday,
        "dal livello del giorno nei passi · stima",
      ),
      row(
        "habit",
        "steps",
        "Passi",
        p.steps,
        "per cadenza: a passo spezzato ≈ 2–2,5 MET, camminate ≈ 3–3,8",
      ),
      row(
        "train",
        "strength",
        "Palestra, serie per serie",
        p.training,
        "media al giorno: lavoro, riposi, dopo-sessione, × 0,75",
      ),
      row(
        "food",
        "lunch",
        "Digerire (effetto termico)",
        p.tef,
        "≈ 10 % di ciò che mangi",
      ),
    ],
  };
}
