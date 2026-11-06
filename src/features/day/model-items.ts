/**
 * features/day/model-items.ts — what the day's model still plans
 * (dossiers/day-templates.md §5, §9.1: computed on the fly, stored only when
 * touched). A block is covered when the day already has its entry — a meal
 * of its role, any session for a training block — eaten, planned or
 * skipped. The rest are shown as the model's planned rows, each opening the
 * flow that makes the real entry (the composer with its role and time, the
 * gym). Today only from an hour ago on: a breakfast missed at 21:00 is not
 * a plan any more. Pure.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import type { DayItem, FoodTargets } from "@/core/day";
import type { Habit, ResolvedBlock } from "@/core/plans";
import { MEAL_ROLE_WORDS } from "./words";

/** Where an untimed meal block sits: its role's usual place in the day. */
const ROLE_AT: Record<string, number> = {
  breakfast: 480,
  lunch: 780,
  snack: 990,
  dinner: 1200,
};
const SESSION_AT = 1080;

export type ModelRow = BoxEntry & { id: string; minute: number };

export function modelItems(p: {
  day: string;
  blocks: readonly ResolvedBlock[];
  items: readonly DayItem[];
  /** The minute now when the day is today; null for a day to come. */
  nowMinute: number | null;
  /** The step due of the day's first cycle, for a training block's name. */
  step: string | null;
  slots: ReadonlyMap<string, FoodTargets>;
}): ModelRow[] {
  const roles = new Set(
    p.items
      .filter((i) => i.kind.key === "meal" && i.subcategory)
      .map((i) => i.subcategory!),
  );
  const trained = p.items.some((i) => i.kind.key === "session");
  const out: ModelRow[] = [];
  for (const b of p.blocks) {
    const role = String(b.defaults?.["role"] ?? "");
    const at = b.when.type === "at" ? b.when.min : null;
    if (b.kind === "meal" && role && !roles.has(role)) {
      const minute = at ?? ROLE_AT[role] ?? 720;
      const slot = p.slots.get(role);
      out.push({
        id: "model:" + b.id,
        minute,
        fam: "food",
        sub: role,
        title: MEAL_ROLE_WORDS[role] ?? "Pasto",
        time: F.time(minute),
        meta:
          "dal modello" +
          (slot
            ? " · " +
              F.approx(slot.kcal, "kcal") +
              (slot.protein ? " · " + F.num(slot.protein, "g") + " proteine" : "")
            : ""),
        planned: true,
        href:
          "/aggiungi/pasto?giorno=" + p.day + "&ruolo=" + role + "&ora=" + F.time(minute),
        hrefLabel: "Componi " + (MEAL_ROLE_WORDS[role] ?? "il pasto").toLowerCase(),
      });
    }
    if (b.kind === "session" && !trained && p.step !== "Riposo") {
      const minute = at ?? SESSION_AT;
      out.push({
        id: "model:" + b.id,
        minute,
        fam: "train",
        sub: "strength",
        title: p.step ?? "Allenamento",
        time: F.time(minute),
        meta: "dal modello" + (b.durationMin ? " · " + F.num(b.durationMin, "min") : ""),
        planned: true,
        href: "/palestra",
        hrefLabel: "Apri la palestra",
      });
    }
  }
  return out
    .filter((r) => p.nowMinute === null || r.minute >= p.nowMinute - 60)
    .sort((a, b) => a.minute - b.minute);
}

/** An untimed habit's place in the day: the evening, after the meals' blocks. */
const HABIT_AT = 1260;

/**
 * The habits due today and not covered (core/plans `habitsDue`) as the
 * day's planned rows «dalle abitudini», each opening its kind's sheet with
 * the category and the time already in. Today, a timed one from an hour
 * ago on; an untimed one stays until covered.
 */
export function habitItems(p: {
  day: string;
  habits: readonly Pick<
    Habit,
    "id" | "name" | "kind" | "category" | "atMin" | "durationMin"
  >[];
  nowMinute: number | null;
  /** A kind's family (the drawing): the kind registry's. */
  familyOf: (kind: string) => string;
}): ModelRow[] {
  return p.habits
    .filter(
      (h) => p.nowMinute === null || h.atMin === null || h.atMin >= p.nowMinute - 60,
    )
    .map((h) => {
      const minute = h.atMin ?? HABIT_AT;
      return {
        id: "habit:" + h.id,
        minute,
        fam: p.familyOf(h.kind),
        title: h.name,
        time: h.atMin === null ? "—" : F.time(minute),
        meta: "abitudine" + (h.durationMin ? " · " + F.num(h.durationMin, "min") : ""),
        planned: true,
        href:
          "/aggiungi/" +
          h.kind +
          "?giorno=" +
          p.day +
          (h.category ? "&categoria=" + h.category : "") +
          (h.atMin !== null ? "&ora=" + F.time(minute) : ""),
        hrefLabel: "Segna " + h.name.toLowerCase(),
      };
    });
}
