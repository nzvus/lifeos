/**
 * features/day/details.ts — what an entry's box shows when it opens (the
 * boards: «si apre come ogni riquadro»), for every kind: the numbers in
 * tiles, then lines — a session's exercises with their sets, a meal's foods
 * with their amounts, the times — then where it comes from (typed, from a
 * model, estimated) and the note. Pure: tested without a browser.
 */
import { F } from "@lifeos/kit";
import type { DayItem } from "@/core/day";
import { lineTotals } from "@/core/food/totals";
import { CHOICES, FIELDS, keyWords } from "./words";

export type Details = {
  stats: { label: string; value: string }[];
  lines: { label: string; value: string }[];
  /** Provenance and the note, in words. */
  foot: string;
};

const SOURCE_WORDS: Record<string, string> = {
  typed: "",
  quick: "aggiunto al volo",
  timer: "dal timer",
  device: "da un dispositivo",
  import: "importato",
  template: "da un modello",
  derived: "calcolato",
};
/** Shown elsewhere in the box (its title or its lines), not again as a tile. */
const HIDDEN = new Set([
  "label",
  "servings",
  "durationMin",
  "role",
  "roleSource",
  "plannedStart",
  "timeMode",
  "estimated",
]);
/** The number the box's title line already shows, per kind. */
const HEADLINE: Record<string, string> = {
  weigh_in: "weightKg",
  steps: "steps",
  water: "ml",
};

const num = (v: unknown) => (typeof v === "string" && v !== "" ? Number(v) : null);
const clock = (d: Date | null, i: DayItem) =>
  d && i.minute !== null && i.start
    ? F.time(i.minute + Math.round((d.getTime() - i.start.getTime()) / 60_000))
    : null;

/** «9, 9, 5 × 60 kg · 7 × 55 kg»: the working sets in order, the reps of a run at one load together. */
function setsText(sets: DayItem["sets"]): string {
  const runs: { load: string | null; reps: string[] }[] = [];
  for (const s of sets.filter((x) => !x.warmup)) {
    const reps =
      s.durationS !== null && s.reps === null
        ? F.clock(s.durationS)
        : String(s.reps ?? "?");
    const last = runs.at(-1);
    if (last && last.load === s.loadKg) last.reps.push(reps);
    else runs.push({ load: s.loadKg, reps: [reps] });
  }
  return runs
    .map(
      (r) =>
        r.reps.join(", ") + (r.load !== null ? " × " + F.num(Number(r.load), "kg") : ""),
    )
    .join(" · ");
}

function fieldValue(i: DayItem, key: string, v: unknown): string | null {
  const f = i.kind.fields.find((x) => x.key === key);
  if (!f || v === undefined || v === null || v === "") return null;
  if (typeof v === "boolean") return v ? "sì" : "no";
  if (f.type === "choice") return CHOICES[key]?.[String(v)] ?? String(v);
  if (f.type === "scale") return F.n(Number(v), 0) + "/" + f.scale;
  if (f.type === "ref") return null;
  const n = num(v);
  if (n !== null && ["number", "integer", "duration"].includes(f.type))
    return F.num(n, f.unit ?? "");
  return typeof v === "string" ? v : null;
}

/** `foods: false`: a meal's foods are shown elsewhere (its window's chips, L2). */
export function details(i: DayItem, { foods = true }: { foods?: boolean } = {}): Details {
  const stats: Details["stats"] = [];
  const lines: Details["lines"] = [];

  for (const [key, v] of Object.entries(i.values)) {
    if (HIDDEN.has(key) || HEADLINE[i.kind.key] === key) continue;
    const value = fieldValue(i, key, v);
    const label = FIELDS[key] ?? i.kind.fields.find((f) => f.key === key)?.label;
    if (value !== null) stats.push({ label: label ?? keyWords(key), value });
  }

  if (i.kind.key === "meal" || i.kind.key === "batch") {
    const servings =
      typeof i.values["servings"] === "string" ? i.values["servings"] : null;
    for (const l of foods ? i.lines : []) {
      const kcal = lineTotals([l], servings)["kcal"];
      lines.push({
        label: l.name || "Senza nome",
        value:
          F.num(Number(l.quantity) * Number(servings ?? "1"), l.unit) +
          (kcal !== undefined && Number(kcal) > 0
            ? " · " + F.n(Number(kcal), 0) + " kcal"
            : ""),
      });
    }
    if (servings !== null && Number(servings) !== 1)
      stats.push({ label: "Porzioni", value: F.n(Number(servings), 2) });
  }

  if (i.kind.key === "session")
    for (const c of i.children) {
      const sets = setsText(c.sets);
      lines.push({ label: c.item?.name ?? "Esercizio", value: sets || "nessuna serie" });
    }

  const from = i.start ? F.time(i.minute ?? 0) : null;
  const to = clock(i.end, i);
  if (from && to) lines.push({ label: "Orario", value: from + "–" + to });

  const foot = [
    SOURCE_WORDS[i.source] ?? "",
    Number(i.confidence) < 1
      ? "stima (affidabilità " + F.num(Number(i.confidence) * 100, "%") + ")"
      : "",
    i.status === "planned" ? "previsto" : i.status === "skipped" ? "saltato" : "",
    i.note,
  ]
    .filter(Boolean)
    .join(" · ");
  return { stats, lines, foot };
}

export const hasDetails = (d: Details) =>
  d.stats.length + d.lines.length > 0 || d.foot !== "";
