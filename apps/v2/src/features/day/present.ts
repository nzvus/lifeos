/**
 * features/day/present.ts — a composed day item as a kit Box (V-01). The
 * one place that decides, per kind, the title, the value, the meta line and
 * the pills on the day; numbers and times go through `F` (content.md).
 * Pure: tested without a browser.
 */
import { F, type BoxEntry, type GlyphOf } from "@lifeos/kit";
import type { DayItem } from "@/core/day";
import { enterable } from "@/core/entries/check";
import { isEaten } from "@/core/kinds";
import { lineTotals } from "@/core/food/totals";
import { ACTIVITY, MEAL_ROLE_WORDS, NAMES } from "./words";
import { MODE_WORDS } from "@/features/movement-words";

const TAGS: Record<string, string> = {
  "pre-workout": "prima dell’allenamento",
  "post-workout": "dopo l’allenamento",
};

const num = (v: unknown) => (typeof v === "string" && v !== "" ? Number(v) : null);
const short = (s: string, max = 80) => (s.length > max ? s.slice(0, max - 1) + "…" : s);
const minutesBetween = (a: Date | null, b: Date | null) =>
  a && b ? (b.getTime() - a.getTime()) / 60_000 : null;

/** What a meal is made of, in words: its saved meal's name, its label, else its foods. */
function mealContents(i: DayItem): string {
  const label = typeof i.values["label"] === "string" ? i.values["label"] : "";
  return (
    i.item?.name ||
    label ||
    i.lines
      .map((l) => l.name)
      .filter(Boolean)
      .join(", ")
  );
}

/** A meal with no energy (one line: a coffee, creatine): a drink or a supplement, named as itself. */
function noEnergy(i: DayItem): boolean {
  if (i.lines.length !== 1) return false;
  const servings = typeof i.values["servings"] === "string" ? i.values["servings"] : null;
  const kcal = lineTotals(i.lines, servings)["kcal"];
  return kcal === undefined || Number(kcal) === 0;
}

/** The role a meal is named by on the day, when it has one and is a meal (not a coffee). */
function roleName(i: DayItem): string | undefined {
  return i.subcategory && !noEnergy(i) ? MEAL_ROLE_WORDS[i.subcategory] : undefined;
}

function title(i: DayItem): string {
  const label = typeof i.values["label"] === "string" ? i.values["label"] : "";
  switch (i.kind.key) {
    case "meal":
      // The boards name a meal by its role; what it was is the line under it.
      return roleName(i) || mealContents(i) || NAMES.meal!;
    case "intake":
      // An «assunzione» is named by what was taken (capture.md §4).
      return label || mealContents(i) || NAMES.intake!;
    case "batch":
      return label || i.item?.name || NAMES.batch!;
    case "session":
      // A session of one exercise and no name is that exercise («Corsa»), not «Allenamento».
      return (
        label ||
        i.item?.name ||
        (i.children.length === 1 ? i.children[0]!.item?.name : undefined) ||
        NAMES.session!
      );
    case "trip":
      // A trip is named by its route («Casa → palestra»).
      return i.item?.name || NAMES.trip!;
    case "activity":
      return ACTIVITY[String(i.values["category"])] ?? NAMES.activity!;
    case "movement":
      return i.note || i.money?.shop || NAMES.movement!;
    case "chore":
      return i.note || NAMES.chore!;
    default:
      return NAMES[i.kind.key] ?? i.kind.name ?? i.item?.name ?? i.kind.key;
  }
}

function value(i: DayItem): string {
  const v = i.values;
  switch (i.kind.key) {
    case "meal":
    case "intake":
    case "batch": {
      const servings = typeof v["servings"] === "string" ? v["servings"] : null;
      const kcal = lineTotals(i.lines, servings)["kcal"];
      // Something with no energy (coffee, creatine, water) says how much, not "0".
      if ((kcal === undefined || Number(kcal) === 0) && i.lines.length === 1) {
        const l = i.lines[0]!;
        return F.num(Number(l.quantity) * Number(servings ?? "1"), l.unit);
      }
      return kcal === undefined ? "" : F.n(Number(kcal), 0);
    }
    case "session": {
      // Its timed sets can last longer than the session was open: a 49-minute run logged
      // afterwards in a session of one minute (28 Oct) is 49 minutes, and is priced so.
      const timed =
        i.children
          .flatMap((c) => c.sets)
          .filter((s) => s.done && !s.warmup)
          .reduce((a, s) => a + (s.durationS ?? 0), 0) / 60;
      const open = num(v["durationMin"]) ?? minutesBetween(i.start, i.end);
      const min = open === null && timed === 0 ? null : Math.max(open ?? 0, timed);
      return min === null ? "" : F.num(Math.round(min), "min");
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
  if (i.kind.name) return userMeta(i);
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
  if (i.kind.key === "trip") {
    const mode = typeof i.values["mode"] === "string" ? MODE_WORDS[i.values["mode"]] : "";
    const min = minutesBetween(i.start, i.end);
    return [mode, min === null ? "" : F.hm(min), i.note ? short(i.note) : ""]
      .filter(Boolean)
      .join(" · ");
  }
  if (i.kind.key === "meal" && roleName(i)) {
    const what = mealContents(i);
    return short([what, i.note].filter(Boolean).join(" · "));
  }
  return i.note ? short(i.note) : "";
}

/**
 * A kind of the person's own (it has their name): each field with their word,
 * «Intensità 3/5 · Farmaco ibuprofene»; the first number is the box's value.
 */
function userMeta(i: DayItem): string {
  const v = i.values;
  const head = i.kind.fields.find(
    (x) => ["number", "integer"].includes(x.type) && num(v[x.key]) !== null,
  );
  const parts = i.kind.fields.flatMap((f) => {
    const x = v[f.key];
    if (f === head || x === undefined || x === null || x === "") return [];
    const shown =
      typeof x === "boolean" || x === "true" || x === "false"
        ? x === true || x === "true"
          ? "sì"
          : "no"
        : f.type === "scale"
          ? F.n(Number(x), 0) + "/" + f.scale
          : f.type === "duration" || f.type === "number" || f.type === "integer"
            ? F.num(Number(x), f.unit ?? "")
            : String(x);
    return [(f.label ?? f.key) + " " + shown];
  });
  return short([...parts, i.note].filter(Boolean).join(" · "));
}

/** A session's working sets and tonnage (the boards: «30 serie · 6.870 kg»); done sets only. */
function sessionPills(i: DayItem): NonNullable<BoxEntry["pills"]> {
  // «serie» are sets with reps: a timed run or a hold is minutes, said by the value.
  const work = i.children
    .flatMap((c) => c.sets)
    .filter((s) => s.done && !s.warmup && s.reps !== null);
  if (work.length === 0) return [];
  const kg = work.reduce(
    (a, s) => a + (s.reps ?? 0) * (s.loadKg === null ? 0 : Number(s.loadKg)),
    0,
  );
  return [
    { t: F.plural(work.length, "serie", "serie") },
    ...(kg > 0 ? [{ t: F.num(kg, "kg") }] : []),
  ];
}

/** A session begun and not finished (session.md §6 «On Oggi»): «in corso · Riprendi», not «Fatto». */
export function isRunning(i: DayItem): boolean {
  return (
    i.kind.key === "session" &&
    i.status === "planned" &&
    i.children.some((c) => c.sets.length > 0)
  );
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
  if (isRunning(i)) pills.push({ t: "in corso", state: "good" });
  if (i.kind.key === "session") pills.push(...sessionPills(i));
  const of: GlyphOf = { kind: i.kind.key, ...i.item?.drawing };
  // A session's exercises: only those with sets, never the strip of every planned one.
  const members = i.children
    .filter((c) => c.item && (i.kind.key !== "session" || c.sets.length > 0))
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
    // A session opens gym mode, a meal its composer, a plain kind its sheet; others come later.
    ...(i.kind.key === "session"
      ? { href: "/palestra/" + i.id, hrefLabel: "Apri in palestra " + title(i) }
      : isEaten(i.kind.key) || i.kind.key === "movement" || enterable(i.kind)
        ? { href: "/voce/" + i.id, hrefLabel: "Modifica " + title(i) }
        : {}),
  };
}
