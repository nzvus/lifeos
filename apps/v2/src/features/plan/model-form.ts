/**
 * features/plan/model-form.ts — Piano's day model editor in words and back
 * (dossiers/day-templates.md §6 «Giornata tipo», the board ModelEditor).
 * Pure: the forms' fields read into what core/plans writes, the model's
 * blocks into the kit's rows. Tested without a browser.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import type { BlockInput, ResolvedBlock } from "@/core/plans";
import { MEAL_ROLE_WORDS } from "@/features/day/words";

export const WEEKDAYS: [number, string][] = [
  [1, "L"],
  [2, "M"],
  [3, "M"],
  [4, "G"],
  [5, "V"],
  [6, "S"],
  [7, "D"],
];

/** A model's targets: following the goal (E4 and the goal's pace) or fixed numbers. */
export const DYNAMIC_FIELDS: [string, string, string, number][] = [
  ["deficitKcal", "Deficit senza obiettivo", "kcal", 50],
  ["proteinGPerKg", "Proteine", "g/kg", 0.1],
  ["fatGPerKg", "Grassi", "g/kg", 0.1],
];
export const FIXED_FIELDS: [string, string, string, number][] = [
  ["kcal", "Energia", "kcal", 50],
  ["protein", "Proteine", "g", 5],
  ["carbs", "Carboidrati", "g", 5],
  ["fat", "Grassi", "g", 5],
  ["fibre", "Fibre", "g", 1],
];

const num = (v: string | undefined) => {
  const t = (v ?? "").trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

/**
 * The targets a model keeps as its own: the mode and every field typed that
 * differs from what it would inherit (a value equal to the base's stays
 * inherited, so the base can still change it). Errors by field.
 */
export function readTargets(
  form: Record<string, string>,
  inherited: Record<string, unknown> | null,
): { targets: Record<string, unknown> | null; errors: Record<string, string> } {
  const mode = form["mode"] === "fixed" ? "fixed" : "dynamic";
  const out: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  if (inherited?.["mode"] !== mode) out["mode"] = mode;
  for (const [key] of mode === "fixed" ? FIXED_FIELDS : DYNAMIC_FIELDS) {
    const v = num(form[key]);
    if (v === null) continue;
    if (Number.isNaN(v)) {
      errors[key] = "Scrivi un numero, per esempio 2,2.";
      continue;
    }
    const base = inherited?.[key];
    if (base !== undefined && base !== null && Number(base) === v) continue;
    out[key] = key === "deficitKcal" ? v : String(v);
  }
  if (mode === "fixed" && out["kcal"] === undefined && inherited?.["kcal"] === undefined)
    errors["kcal"] = "Numeri fissi: serve almeno l’energia.";
  return { targets: Object.keys(out).length ? out : null, errors };
}

/** «08:30» → 510; empty → null; anything else → NaN. */
export function readTime(v: string | undefined): number | null {
  const t = (v ?? "").trim();
  if (t === "") return null;
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(t);
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : NaN;
}

/** A block's form: kind, role, time, duration, the meal's shares in %. */
export function readBlock(
  form: Record<string, string>,
): { ok: true; block: BlockInput } | { ok: false; errors: Record<string, string> } {
  const kind = form["kind"] === "session" ? "session" : "meal";
  const errors: Record<string, string> = {};
  const atMin = readTime(form["at"]);
  if (Number.isNaN(atMin)) errors["at"] = "Un orario come 13:00.";
  const pct = (key: string) => {
    const v = num(form[key]);
    if (v === null) return null;
    if (Number.isNaN(v) || v > 100) {
      errors[key] = "Una percentuale da 0 a 100.";
      return null;
    }
    return (v / 100).toFixed(3);
  };
  const duration = num(form["durationMin"]);
  if (Number.isNaN(duration)) errors["durationMin"] = "I minuti, per esempio 60.";
  const role = form["role"] ?? "";
  const block: BlockInput = {
    kind,
    role: kind === "meal" && role in MEAL_ROLE_WORDS ? role : null,
    atMin: Number.isNaN(atMin) ? null : atMin,
    durationMin:
      kind === "session" && duration !== null && !Number.isNaN(duration)
        ? Math.round(duration)
        : null,
    kcalShare: kind === "meal" ? pct("kcalShare") : null,
    proteinShare: kind === "meal" ? pct("proteinShare") : null,
  };
  if (kind === "meal" && block.role === null) errors["role"] = "Quale pasto è.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, block };
}

const ORIGIN_WORDS = {
  base: "dalla base",
  local: "solo qui",
  changed: "cambiato qui",
} as const;

/** A block's time in words: «08:00», «60 min dopo …», or «—» when it has none. */
export function whenWords(b: ResolvedBlock, names: ReadonlyMap<string, string>): string {
  const w = b.when;
  switch (w.type) {
    case "at":
      return F.time(w.min);
    case "after":
      return (
        (w.offsetMin >= 0
          ? F.num(w.offsetMin, "min") + " dopo "
          : F.num(-w.offsetMin, "min") + " prima di ") +
        (names.get(w.anchor) ?? "un blocco")
      );
    case "afterWake":
      return F.num(w.offsetMin, "min") + " dopo la sveglia";
    case "beforeBed":
      return F.num(w.offsetMin, "min") + " prima di dormire";
    default:
      return "—";
  }
}

export const blockName = (b: Pick<ResolvedBlock, "kind" | "defaults">) =>
  b.kind === "meal"
    ? (MEAL_ROLE_WORDS[String(b.defaults?.["role"] ?? "")] ?? "Pasto")
    : b.kind === "session"
      ? "Allenamento"
      : b.kind;

/**
 * A block as a kit row: its time, its name, what it holds of the day (a
 * meal's shares, with the grams of protein when the day's targets are
 * known), where it comes from.
 */
export function blockRow(
  b: ResolvedBlock,
  names: ReadonlyMap<string, string>,
  base: string | null,
  day: { kcal: number; protein: number | null } | null,
): BoxEntry {
  const s = b.shares ?? {};
  const meta =
    b.kind === "meal"
      ? [
          s.kcal !== undefined
            ? F.num(s.kcal * 100, "%") +
              " kcal" +
              (day ? " (" + F.approx(day.kcal * s.kcal, "kcal") + ")" : "")
            : "quota da decidere",
          s.protein !== undefined || s.kcal !== undefined
            ? F.num((s.protein ?? s.kcal!) * 100, "%") +
              " proteine" +
              (day?.protein
                ? " (" +
                  F.approx(Math.round(day.protein * (s.protein ?? s.kcal!)), "g") +
                  ")"
                : "")
            : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : b.durationMin
        ? F.num(b.durationMin, "min")
        : "";
  const role = String(b.defaults?.["role"] ?? "");
  return {
    fam: b.kind === "meal" ? "food" : b.kind === "session" ? "train" : "day",
    ...(b.kind === "meal" && role
      ? { sub: role }
      : b.kind === "session"
        ? { sub: "strength" }
        : {}),
    title: blockName(b),
    time: whenWords(b, names),
    meta,
    planned: true,
    pills: [
      {
        t: b.origin === "base" && base ? "da «" + base + "»" : ORIGIN_WORDS[b.origin],
        state: b.origin === "changed" ? "warn" : "info",
      },
    ],
  };
}

/** The meal blocks' kcal shares added up: a warning when they are far from the whole day. */
export function sharesWords(
  blocks: readonly ResolvedBlock[],
): { t: string; state: "good" | "warn" } | null {
  const meals = blocks.filter((b) => b.kind === "meal" && b.shares?.kcal !== undefined);
  if (meals.length === 0) return null;
  const sum = meals.reduce((a, b) => a + b.shares!.kcal!, 0);
  const ok = Math.abs(sum - 1) <= 0.05;
  return {
    t:
      "i pasti fanno " +
      F.num(sum * 100, "%") +
      " delle kcal del giorno" +
      (ok ? "" : ": il resto resta libero o manca"),
    state: ok ? "good" : "warn",
  };
}
