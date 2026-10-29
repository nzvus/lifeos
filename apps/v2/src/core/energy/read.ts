/**
 * core/energy/read.ts — what E4 needs for a range of days, and nothing more
 * (dossiers/targets.md §4; Neon bills the bytes): each done meal's kcal
 * (only the `kcal` line values), whether it was an estimate, the closed
 * days, the weigh-ins with what was said about them, steps and time on
 * one's feet, the sessions with their sets and their exercises' patterns,
 * and the body in the settings. Everything `ownedBy` the owner.
 */
import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogValues,
  decisions,
  entries,
  entryLines,
  entryLineValues,
  entryValues,
  settings,
  trainingSets,
} from "../db/schema";
import { CARDIO_MET } from "../engines/expenditure";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export type EnergyRows = {
  meals: { day: IsoDate; kcal: number; estimated: boolean }[];
  /** Days closed as «ho segnato tutto»; `partial`: closed as «manca qualcosa» (E4 filter.ts). */
  closed: IsoDate[];
  partial: IsoDate[];
  weighIns: {
    day: IsoDate;
    at: Date | null;
    kg: number;
    fasted: boolean | null;
    afterToilet: boolean | null;
    afterTraining: boolean | null;
  }[];
  steps: {
    day: IsoDate;
    steps: number | null;
    level: string | null;
    onFeetH?: number | null;
  }[];
  sessions: {
    id: string;
    day: IsoDate;
    minutes: number | null;
    exercises: {
      pattern: string | null;
      /** An activity (catalog kind «cardio» or a cardio pattern): costs a MET band over its minutes. */
      cardio: boolean;
      /** Its timed minutes (the sets' durations), when it has any. */
      cardioMin: number | null;
      sets: {
        reps: number;
        kg: number;
        rir: number | null;
        start: number | null;
        end: number | null;
      }[];
    }[];
  }[];
  profile: { sex: "male" | "female"; birthYear: number; heightCm: number } | null;
};

const n = (v: string | null | undefined) => (v == null ? null : Number(v));

/** A kind's done entries in the range, with the values of the fields asked. */
async function doneWithValues(
  db: Db,
  owner: Owner,
  kind: string,
  fields: readonly string[],
  from: IsoDate,
  to: IsoDate,
) {
  const rows = await db
    .select({
      id: entries.id,
      day: entries.day,
      startAt: entries.startAt,
      endAt: entries.endAt,
      confidence: entries.confidence,
    })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, kind),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        gte(entries.day, from),
        lte(entries.day, to),
      ),
    );
  const ids = rows.map((r) => r.id);
  const values = ids.length
    ? await db
        .select({
          entryId: entryValues.entryId,
          field: entryValues.field,
          num: entryValues.num,
          text: entryValues.text,
          bool: entryValues.bool,
        })
        .from(entryValues)
        .where(
          and(
            ownedBy(entryValues, owner),
            inArray(entryValues.entryId, ids),
            inArray(entryValues.field, [...fields]),
          ),
        )
    : [];
  const byEntry = new Map<string, Map<string, (typeof values)[number]>>();
  for (const v of values) {
    const m = byEntry.get(v.entryId) ?? new Map();
    m.set(v.field, v);
    byEntry.set(v.entryId, m);
  }
  return rows.map((r) => ({ ...r, values: byEntry.get(r.id) ?? new Map() }));
}

async function readMeals(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
): Promise<EnergyRows["meals"]> {
  const meals = await doneWithValues(db, owner, "meal", ["servings"], from, to);
  if (meals.length === 0) return [];
  const lines = await db
    .select({
      id: entryLines.id,
      entryId: entryLines.entryId,
      quantity: entryLines.quantity,
    })
    .from(entryLines)
    .where(
      and(
        ownedBy(entryLines, owner),
        inArray(
          entryLines.entryId,
          meals.map((m) => m.id),
        ),
      ),
    );
  const kcal = lines.length
    ? await db
        .select({ lineId: entryLineValues.lineId, num: entryLineValues.num })
        .from(entryLineValues)
        .where(
          and(
            ownedBy(entryLineValues, owner),
            eq(entryLineValues.field, "kcal"),
            inArray(
              entryLineValues.lineId,
              lines.map((l) => l.id),
            ),
          ),
        )
    : [];
  const per100 = new Map(kcal.map((k) => [k.lineId, Number(k.num)]));
  const total = new Map<string, number>();
  for (const l of lines)
    total.set(
      l.entryId,
      (total.get(l.entryId) ?? 0) + ((per100.get(l.id) ?? 0) * Number(l.quantity)) / 100,
    );
  return meals.map((m) => ({
    day: m.day,
    kcal: (total.get(m.id) ?? 0) * (n(m.values.get("servings")?.num) ?? 1),
    // A meal typed as an estimate (v1's «stima»: confidence 0.6), not weighed.
    estimated: Number(m.confidence) < 1,
  }));
}

async function readSessions(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
): Promise<EnergyRows["sessions"]> {
  const sessions = await doneWithValues(db, owner, "session", ["durationMin"], from, to);
  if (sessions.length === 0) return [];
  const children = await db
    .select({ id: entries.id, parentId: entries.parentId, itemId: entries.itemId })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "session_exercise"),
        isNull(entries.deletedAt),
        inArray(
          entries.parentId,
          sessions.map((s) => s.id),
        ),
      ),
    );
  const itemIds = [...new Set(children.flatMap((c) => (c.itemId ? [c.itemId] : [])))];
  const [sets, patterns] = await Promise.all([
    children.length
      ? db
          .select({
            entryId: trainingSets.entryId,
            reps: trainingSets.reps,
            loadKg: trainingSets.loadKg,
            rir: trainingSets.rir,
            warmup: trainingSets.warmup,
            durationS: trainingSets.durationS,
            startedAt: trainingSets.startedAt,
            endedAt: trainingSets.endedAt,
          })
          .from(trainingSets)
          .where(
            and(
              ownedBy(trainingSets, owner),
              inArray(
                trainingSets.entryId,
                children.map((c) => c.id),
              ),
            ),
          )
      : [],
    itemIds.length
      ? db
          .select({
            itemId: catalogValues.itemId,
            field: catalogValues.field,
            text: catalogValues.text,
          })
          .from(catalogValues)
          .where(
            and(
              ownedBy(catalogValues, owner),
              inArray(catalogValues.field, ["pattern", "kind"]),
              inArray(catalogValues.itemId, itemIds),
            ),
          )
      : [],
  ]);
  const valueOf = (field: string) =>
    new Map(patterns.filter((p) => p.field === field).map((p) => [p.itemId, p.text]));
  const patternOf = valueOf("pattern");
  const kindOf = valueOf("kind");
  return sessions.map((s) => {
    const span =
      s.startAt && s.endAt ? (s.endAt.getTime() - s.startAt.getTime()) / 60_000 : null;
    return {
      id: s.id,
      day: s.day,
      minutes: n(s.values.get("durationMin")?.num) ?? span,
      exercises: children
        .filter((c) => c.parentId === s.id)
        .map((c) => {
          const pattern = (c.itemId && patternOf.get(c.itemId)) || null;
          const timed = sets
            .filter((x) => x.entryId === c.id && !x.warmup)
            .reduce((a, x) => a + (x.durationS ?? 0), 0);
          return {
            pattern,
            cardio:
              (c.itemId !== null && kindOf.get(c.itemId) === "cardio") ||
              (pattern !== null && pattern in CARDIO_MET),
            cardioMin: timed > 0 ? timed / 60 : null,
            sets: sets
              .filter((x) => x.entryId === c.id && !x.warmup && (x.reps ?? 0) > 0)
              .map((x) => ({
                reps: x.reps!,
                kg: Number(x.loadKg ?? 0),
                rir: x.rir,
                start: x.startedAt?.getTime() ?? null,
                end: x.endedAt?.getTime() ?? null,
              })),
          };
        }),
    };
  });
}

export async function readEnergyRows(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
): Promise<EnergyRows> {
  const [meals, closed, weighIns, steps, sessions, profile] = await Promise.all([
    readMeals(db, owner, from, to),
    db
      .select({ day: decisions.day, payload: decisions.payload })
      .from(decisions)
      .where(
        and(
          ownedBy(decisions, owner),
          eq(decisions.kind, "day_closed"),
          gte(decisions.day, from),
          lte(decisions.day, to),
        ),
      ),
    doneWithValues(
      db,
      owner,
      "weigh_in",
      ["weightKg", "fasted", "afterToilet", "afterTraining"],
      from,
      to,
    ),
    doneWithValues(db, owner, "steps", ["steps", "level", "onFeetH"], from, to),
    readSessions(db, owner, from, to),
    db
      .select({
        sex: settings.sex,
        birthYear: settings.birthYear,
        heightCm: settings.heightCm,
      })
      .from(settings)
      .where(ownedBy(settings, owner))
      .limit(1),
  ]);
  const p = profile[0];
  return {
    meals,
    closed: closed.filter((c) => !isPartial(c.payload)).map((c) => c.day),
    partial: closed.filter((c) => isPartial(c.payload)).map((c) => c.day),
    weighIns: weighIns.flatMap((w) => {
      const kg = n(w.values.get("weightKg")?.num);
      return kg === null
        ? []
        : [
            {
              day: w.day,
              at: w.startAt,
              kg,
              fasted: w.values.get("fasted")?.bool ?? null,
              afterToilet: w.values.get("afterToilet")?.bool ?? null,
              afterTraining: w.values.get("afterTraining")?.bool ?? null,
            },
          ];
    }),
    steps: steps.map((s) => ({
      day: s.day,
      steps: n(s.values.get("steps")?.num),
      level: s.values.get("level")?.text ?? null,
      onFeetH: n(s.values.get("onFeetH")?.num),
    })),
    sessions,
    profile:
      p && p.sex && p.birthYear && p.heightCm
        ? { sex: p.sex, birthYear: p.birthYear, heightCm: Number(p.heightCm) }
        : null,
  };
}

/** A closure's state (v1's «complete»/«partial»; none means complete). */
const isPartial = (p: unknown) =>
  typeof p === "object" && p !== null && (p as { state?: unknown }).state === "partial";
