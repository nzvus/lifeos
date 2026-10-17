/**
 * features/day/present.ts — a composed day item as a kit Box (V-01). The
 * one place that decides, per kind, the title, the value, the meta line and
 * the pills on the day; numbers and times go through `F` (content.md).
 * Pure: tested without a browser.
 */
import { F, type BoxEntry, type GlyphOf } from "@lifeos/kit";
import type { DayItem } from "@/core/day";
import { lineTotals } from "@/core/food/totals";

/** Built-in kinds' names on the day (Italian, content.md). */
const NAMES: Record<string, string> = {
  meal: "Pasto",
  batch: "Cucinato",
  water: "Acqua",
  session: "Allenamento",
  steps: "Passi",
  activity: "Attività",
  reading: "Lettura",
  weigh_in: "Peso",
  measurements: "Misure",
  sleep: "Sveglia",
  nap: "Riposo",
  checkin: "Come stai",
  journal: "Diario",
  movement: "Movimento",
  purchase: "Spesa",
  stock_count: "Scorta",
  chore: "Faccenda",
};
const ACTIVITY: Record<string, string> = {
  work: "Lavoro",
  study: "Studio",
  commute: "Spostamenti",
  chores: "Faccende",
  leisure: "Tempo libero",
  social: "Amici",
  family: "Famiglia",
  screen: "Schermi",
};
const TAGS: Record<string, string> = {
  "pre-workout": "prima dell’allenamento",
  "post-workout": "dopo l’allenamento",
};

const num = (v: unknown) => (typeof v === "string" && v !== "" ? Number(v) : null);
const short = (s: string, max = 80) => (s.length > max ? s.slice(0, max - 1) + "…" : s);
const minutesBetween = (a: Date | null, b: Date | null) =>
  a && b ? (b.getTime() - a.getTime()) / 60_000 : null;

function title(i: DayItem): string {
  const label = typeof i.values["label"] === "string" ? i.values["label"] : "";
  switch (i.kind.key) {
    case "meal":
      return (
        i.item?.name ||
        label ||
        i.lines
          .map((l) => l.name)
          .filter(Boolean)
          .join(", ") ||
        NAMES.meal!
      );
    case "batch":
      return label || i.item?.name || NAMES.batch!;
    case "session":
      return label || i.item?.name || NAMES.session!;
    case "activity":
      return ACTIVITY[String(i.values["category"])] ?? NAMES.activity!;
    case "movement":
      return i.note || i.money?.shop || NAMES.movement!;
    case "chore":
      return i.note || NAMES.chore!;
    default:
      return NAMES[i.kind.key] ?? i.item?.name ?? i.kind.key;
  }
}

function value(i: DayItem): string {
  const v = i.values;
  switch (i.kind.key) {
    case "meal":
    case "batch": {
      const servings = typeof v["servings"] === "string" ? v["servings"] : null;
      const kcal = lineTotals(i.lines, servings)["kcal"];
      return kcal === undefined ? "" : F.n(Number(kcal), 0);
    }
    case "session": {
      const min = num(v["durationMin"]) ?? minutesBetween(i.start, i.end);
      return min === null ? "" : F.num(min, "min");
    }
    case "sleep":
    case "nap":
    case "activity":
    case "reading": {
      const min = minutesBetween(i.start, i.end);
      return min === null
        ? ""
        : i.kind.key === "sleep"
          ? F.num(min / 60, "h")
          : F.hm(min);
    }
    case "weigh_in":
      return num(v["weightKg"]) === null ? "" : F.num(num(v["weightKg"])!, "kg");
    case "steps":
      return num(v["steps"]) === null ? "" : F.num(num(v["steps"])!, "");
    case "water":
      return num(v["ml"]) === null ? "" : F.num(num(v["ml"])!, "ml");
    case "movement":
      return i.money ? F.signed(i.money.amountCents / 100, "€") : "";
    case "purchase":
      return num(v["priceCents"]) === null ? "" : F.num(num(v["priceCents"])! / 100, "€");
    default: {
      // A kind of the person's own: its first number, with its unit.
      const f = i.kind.fields.find(
        (x) => ["number", "integer"].includes(x.type) && num(v[x.key]) !== null,
      );
      return f ? F.num(num(v[f.key])!, f.unit ?? "") : "";
    }
  }
}

function meta(i: DayItem): string {
  if (i.kind.key === "checkin") {
    const parts = (
      [
        ["umore", "mood"],
        ["energia", "energy"],
        ["stress", "stress"],
      ] as const
    )
      .filter(([, k]) => num(i.values[k]) !== null)
      .map(([w, k]) => w + " " + F.n(num(i.values[k])!, 0) + "/5");
    return parts.join(" · ");
  }
  if (["movement", "chore"].includes(i.kind.key)) return "";
  return i.note ? short(i.note) : "";
}

export function present(i: DayItem): BoxEntry {
  const pills: NonNullable<BoxEntry["pills"]> = [];
  for (const t of i.tags) pills.push({ t: TAGS[t] ?? t, of: { fam: "train" } });
  if (i.status === "skipped") pills.push({ t: "saltato", state: "muted" });
  if (i.kind.key === "weigh_in" && i.values["fasted"] !== undefined)
    pills.push(
      i.values["fasted"] === true
        ? { t: "a digiuno", state: "good" }
        : { t: "non a digiuno", state: "warn" },
    );
  if (Number(i.confidence) < 1) pills.push({ t: "stimato", state: "warn" });
  const of: GlyphOf = { kind: i.kind.key, ...i.item?.drawing };
  const members = i.children
    .filter((c) => c.item)
    .map((c) => ({ fam: "train", ...c.item!.drawing, title: c.item!.name }));
  return {
    fam: i.family,
    ...(i.subcategory ? { sub: i.subcategory } : {}),
    of,
    title: title(i),
    value: value(i),
    meta: meta(i),
    ...(i.minute !== null ? { time: F.time(i.minute) } : {}),
    planned: i.status === "planned",
    faded: i.status === "skipped",
    pills,
    members,
  };
}
