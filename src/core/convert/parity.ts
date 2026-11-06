/**
 * Parity checks (migration.md): the numbers v1 computes from its export
 * against the same numbers computed from the v2 rows once loaded. They must
 * be equal before a switch; each difference is listed.
 *   food      every nutrient eaten, and with the plan, per day; the day's cost (exact)
 *   training  working sets, tonnage, minutes per session; best e1RM per
 *             exercise per session (exact, by v1's Epley: the data, not E6's RIR)
 *   body      each weigh-in's value
 *   sleep     hours per night (exact)
 *   money     cents per month and category
 *   counts    v1 rows against v2 entries per kind
 * The trend weight (E4 against v1's estimators) waits for the body slice's
 * day priors: it is a model comparison, not a data one.
 */
import Big from "big.js";
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as s from "../db/schema";
import type { V1Export, V1Row } from "./context";

export type Metrics = Map<string, string>;

const NUTRIENTS = [
  ["kcal", "kcal"],
  ["protein", "protein"],
  ["carbs", "carbs"],
  ["sugars", "sugars"],
  ["fat", "fat"],
  ["saturatedFat", "saturatedFat"],
  ["fiber", "fibre"],
  ["salt", "salt"],
] as const;
const SET_WORK_S = 45;
const SET_REST_S = 90;

type Line = {
  quantity: string;
  per100: Record<string, string | null>;
  price: string | null;
  size: string | null;
};
type Meal = {
  day: string;
  status: "planned" | "done" | "skipped";
  leftOut: boolean;
  servings: string;
  lines: Line[];
};
type SetRow = {
  reps: number | null;
  loadKg: string | null;
  warmup: boolean;
  loadApprox: boolean;
  durationS: number | null;
};
type Session = {
  id: string;
  durationMin: number | null;
  exercises: { id: string; item: string | null; restS: number | null; sets: SetRow[] }[];
};

const big = (x: string | number | null | undefined) => new Big(x ?? 0);

function food(meals: readonly Meal[], out: Metrics) {
  const days = new Map<string, Meal[]>();
  for (const m of meals) days.set(m.day, [...(days.get(m.day) ?? []), m]);
  for (const [day, ms] of days)
    for (const [view, keep] of [
      ["eaten", (m: Meal) => m.status === "done"],
      [
        "plan",
        (m: Meal) => m.status === "done" || (m.status === "planned" && !m.leftOut),
      ],
    ] as const) {
      const sums = new Map<string, Big>(NUTRIENTS.map(([, f]) => [f, new Big(0)]));
      let cost = new Big(0);
      let complete = true;
      for (const m of ms.filter(keep))
        for (const l of m.lines) {
          const qty = big(l.quantity).times(m.servings);
          for (const [, f] of NUTRIENTS)
            sums.set(f, sums.get(f)!.plus(big(l.per100[f]).times(qty).div(100)));
          if (l.price === null || l.size === null || big(l.size).eq(0)) complete = false;
          else cost = cost.plus(big(l.price).times(qty).div(l.size));
        }
      for (const [f, v] of sums) out.set(`food|${day}|${view}|${f}`, v.toString());
      out.set(`food|${day}|${view}|costCents`, cost.toString());
      out.set(`food|${day}|${view}|costComplete`, String(complete));
    }
}

function training(sessions: readonly Session[], out: Metrics) {
  for (const t of sessions) {
    const sets = t.exercises.flatMap((e) => e.sets);
    const work = sets.filter((x) => !x.warmup);
    out.set(`training|${t.id}|workingSets`, String(work.length));
    out.set(
      `training|${t.id}|tonnage`,
      work
        .filter((x) => !x.loadApprox)
        .reduce((a, x) => a.plus(big(x.loadKg).times(x.reps ?? 0)), new Big(0))
        .toString(),
    );
    const seconds = t.exercises.reduce(
      (a, e) =>
        a +
        e.sets.reduce(
          (b, x) =>
            b + (x.durationS ? x.durationS : SET_WORK_S + (e.restS ?? SET_REST_S)),
          0,
        ),
      0,
    );
    out.set(
      `training|${t.id}|minutes`,
      String(
        t.durationMin ? t.durationMin : seconds > 0 ? Math.round(seconds / 60) : null,
      ),
    );
    const best = new Map<string, Big>();
    for (const e of t.exercises)
      for (const x of e.sets.filter((y) => !y.warmup)) {
        if (
          x.reps === null ||
          x.reps < 1 ||
          x.reps > 12 ||
          x.loadKg === null ||
          big(x.loadKg).lte(0)
        )
          continue;
        const v = big(x.loadKg)
          .times(30 + x.reps)
          .div(30);
        const k = e.item ?? e.id;
        if (!best.has(k) || v.gt(best.get(k)!)) best.set(k, v);
      }
    for (const [ex, v] of best) out.set(`e1rm|${t.id}|${ex}`, v.toString());
  }
}

const hours = (bed: string | null, wake: string | null) =>
  bed && wake && wake > bed
    ? new Big(Date.parse(wake) - Date.parse(bed)).div(3_600_000).toString()
    : "null";

/** v1's numbers, from its export (live rows only, as v1's screens read them). */
export function v1Metrics(v1: V1Export): Metrics {
  const out: Metrics = new Map();
  const T = (t: string): V1Row[] => (v1.tables[t] ?? []).filter((r) => !r["deletedAt"]);
  const leftOut = new Set(T("log_entry_left_out").map((r) => String(r["entryId"])));
  const lines = new Map<string, Line[]>();
  for (const i of T("log_entry_items"))
    lines.set(String(i["entryId"]), [
      ...(lines.get(String(i["entryId"])) ?? []),
      {
        quantity: String(i["quantity"]),
        per100: Object.fromEntries(
          NUTRIENTS.map(([c, f]) => [f, i[c] === null ? null : String(i[c])]),
        ),
        price:
          i["packagePriceCents"] === null || i["packagePriceCents"] === undefined
            ? null
            : String(i["packagePriceCents"]),
        size:
          i["packageSize"] === null || i["packageSize"] === undefined
            ? null
            : String(i["packageSize"]),
      },
    ]);
  const status = (x: unknown) =>
    (x === "eaten" ? "done" : x === "skipped" ? "skipped" : "planned") as Meal["status"];
  food(
    T("log_entries").map((e) => ({
      day: String(e["day"]),
      status: status(e["status"]),
      leftOut: leftOut.has(String(e["id"])),
      servings: String(e["servings"] ?? "1"),
      lines: lines.get(String(e["id"])) ?? [],
    })),
    out,
  );
  const setsBy = new Map<string, SetRow[]>();
  for (const x of v1.tables["sets"] ?? [])
    setsBy.set(String(x["sessionExerciseId"]), [
      ...(setsBy.get(String(x["sessionExerciseId"])) ?? []),
      {
        reps: x["reps"] === null ? null : Number(x["reps"]),
        loadKg: x["loadKg"] === null ? null : String(x["loadKg"]),
        warmup: x["warmup"] === true,
        loadApprox: x["loadApprox"] === true,
        durationS: x["durationS"] === null ? null : Number(x["durationS"]),
      },
    ]);
  const exBy = new Map<string, Session["exercises"]>();
  for (const e of v1.tables["session_exercises"] ?? [])
    exBy.set(String(e["sessionId"]), [
      ...(exBy.get(String(e["sessionId"])) ?? []),
      {
        id: String(e["id"]),
        item: e["exerciseId"] ? String(e["exerciseId"]) : null,
        restS: e["restS"] === null ? null : Number(e["restS"]),
        sets: setsBy.get(String(e["id"])) ?? [],
      },
    ]);
  training(
    T("training_sessions").map((t) => ({
      id: String(t["id"]),
      durationMin: t["durationMin"] === null ? null : Number(t["durationMin"]),
      exercises: exBy.get(String(t["id"])) ?? [],
    })),
    out,
  );
  for (const m of T("body_measurements"))
    if (m["weightKg"] !== null && m["weightKg"] !== undefined)
      out.set(`body|${String(m["id"])}|weightKg`, big(String(m["weightKg"])).toString());
  for (const sl of v1.tables["sleep_logs"] ?? [])
    out.set(
      `sleep|${String(sl["day"])}`,
      hours(sl["bedAt"] as string | null, sl["wakeAt"] as string | null),
    );
  for (const m of T("money_movements")) {
    const k = `money|${String(m["day"]).slice(0, 7)}|${String(m["categoryId"] ?? "none")}`;
    out.set(
      k,
      big(out.get(k) ?? 0)
        .plus(Number(m["amountCents"]))
        .toString(),
    );
  }
  const count = (kind: string, n: number) => out.set(`count|${kind}`, String(n));
  count("meal", T("log_entries").length);
  count("session", T("training_sessions").length);
  const liveSessions = new Set(T("training_sessions").map((t) => String(t["id"])));
  const liveExercises = (v1.tables["session_exercises"] ?? []).filter((e) =>
    liveSessions.has(String(e["sessionId"])),
  );
  const liveExerciseIds = new Set(liveExercises.map((e) => String(e["id"])));
  count("session_exercise", liveExercises.length);
  count("body", T("body_measurements").length);
  count("steps", (v1.tables["day_activity"] ?? []).length);
  count("sleep", (v1.tables["sleep_logs"] ?? []).length);
  count("checkin", (v1.tables["day_checkins"] ?? []).length);
  count("movement", T("money_movements").length);
  count(
    "sets",
    (v1.tables["sets"] ?? []).filter((x) =>
      liveExerciseIds.has(String(x["sessionExerciseId"])),
    ).length,
  );
  return out;
}

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

/** The same numbers from the v2 rows of an owner (live entries only). */
export async function v2Metrics(db: Db, userId: string): Promise<Metrics> {
  const out: Metrics = new Map();
  const live = await db
    .select()
    .from(s.entries)
    .where(and(eq(s.entries.userId, userId), isNull(s.entries.deletedAt)));
  const ids = live.map((e) => e.id);
  const values = ids.length
    ? await db.select().from(s.entryValues).where(inArray(s.entryValues.entryId, ids))
    : [];
  const val = new Map(values.map((v) => [`${v.entryId}|${v.field}`, v]));
  const meals = live.filter((e) => e.kind === "meal");
  const lineRows = meals.length
    ? await db
        .select()
        .from(s.entryLines)
        .where(
          inArray(
            s.entryLines.entryId,
            meals.map((m) => m.id),
          ),
        )
    : [];
  const lineValues = lineRows.length
    ? await db
        .select()
        .from(s.entryLineValues)
        .where(
          inArray(
            s.entryLineValues.lineId,
            lineRows.map((l) => l.id),
          ),
        )
    : [];
  const per = new Map<string, Record<string, string>>();
  for (const v of lineValues)
    per.set(v.lineId, { ...(per.get(v.lineId) ?? {}), [v.field]: v.num });
  const linesBy = new Map<string, Line[]>();
  for (const l of lineRows) {
    const p = per.get(l.id) ?? {};
    linesBy.set(l.entryId, [
      ...(linesBy.get(l.entryId) ?? []),
      {
        quantity: l.quantity,
        per100: Object.fromEntries(NUTRIENTS.map(([, f]) => [f, p[f] ?? null])),
        price: p["packagePriceCents"] ?? null,
        size: p["packageSize"] ?? null,
      },
    ]);
  }
  food(
    meals.map((m) => ({
      day: m.day,
      status: m.status,
      leftOut: val.get(`${m.id}|leftOut`)?.bool === true,
      servings: val.get(`${m.id}|servings`)?.num ?? "1",
      lines: linesBy.get(m.id) ?? [],
    })),
    out,
  );
  const sessions = live.filter((e) => e.kind === "session");
  const exercises = live.filter((e) => e.kind === "session_exercise");
  const sets = exercises.length
    ? await db
        .select()
        .from(s.trainingSets)
        .where(
          inArray(
            s.trainingSets.entryId,
            exercises.map((e) => e.id),
          ),
        )
    : [];
  const setsBy = new Map<string, SetRow[]>();
  for (const x of sets)
    setsBy.set(x.entryId, [
      ...(setsBy.get(x.entryId) ?? []),
      {
        reps: x.reps,
        loadKg: x.loadKg,
        warmup: x.warmup,
        loadApprox: x.loadApprox,
        durationS: x.durationS,
      },
    ]);
  const n = (id: string, f: string) => {
    const v = val.get(`${id}|${f}`)?.num;
    return v === undefined || v === null ? null : Number(v);
  };
  training(
    sessions.map((t) => ({
      id: t.id,
      durationMin: n(t.id, "durationMin"),
      exercises: exercises
        .filter((e) => e.parentId === t.id)
        .sort((a, b) => (n(a.id, "position") ?? 0) - (n(b.id, "position") ?? 0))
        .map((e) => ({
          id: e.id,
          item: e.itemId,
          restS: n(e.id, "restS"),
          sets: setsBy.get(e.id) ?? [],
        })),
    })),
    out,
  );
  for (const w of live.filter((e) => e.kind === "weigh_in")) {
    const v = val.get(`${w.id}|weightKg`)?.num;
    if (v) out.set(`body|${w.id}|weightKg`, big(v).toString());
  }
  for (const sl of live.filter((e) => e.kind === "sleep"))
    out.set(
      `sleep|${sl.day}`,
      sl.startAt && sl.endAt
        ? hours(sl.startAt.toISOString(), sl.endAt.toISOString())
        : hours(
            val.get(`${sl.id}|bedAt`)?.text ?? null,
            val.get(`${sl.id}|wakeAt`)?.text ?? null,
          ),
    );
  const movements = live.filter((e) => e.kind === "movement");
  const money = movements.length
    ? await db
        .select()
        .from(s.moneyMovements)
        .where(
          inArray(
            s.moneyMovements.entryId,
            movements.map((m) => m.id),
          ),
        )
    : [];
  const dayOf = new Map(movements.map((m) => [m.id, m.day]));
  for (const m of money) {
    const k = `money|${dayOf.get(m.entryId)!.slice(0, 7)}|${m.categoryId ?? "none"}`;
    out.set(
      k,
      big(out.get(k) ?? 0)
        .plus(m.amountCents)
        .toString(),
    );
  }
  const count = (kind: string, n: number) => out.set(`count|${kind}`, String(n));
  const of = (k: string) => live.filter((e) => e.kind === k).length;
  count("meal", of("meal"));
  count("session", of("session"));
  const sessionIds = new Set(sessions.map((t) => t.id));
  const ofLive = new Set(
    exercises
      .filter((e) => e.parentId !== null && sessionIds.has(e.parentId))
      .map((e) => e.id),
  );
  count("session_exercise", ofLive.size);
  count("body", of("weigh_in") + of("measurements"));
  count("steps", of("steps"));
  count("sleep", of("sleep"));
  count("checkin", of("checkin"));
  count("movement", of("movement"));
  count("sets", sets.filter((x) => ofLive.has(x.entryId)).length);
  return out;
}

export type Parity = {
  equal: number;
  different: { key: string; v1: string | undefined; v2: string | undefined }[];
};

/** Every key of either side; a value equal as a decimal (or as text) counts once. */
export function compare(a: Metrics, b: Metrics): Parity {
  const keys = [...new Set([...a.keys(), ...b.keys()])].sort();
  const sameValue = (x: string | undefined, y: string | undefined) => {
    if (x === undefined || y === undefined) return x === y;
    try {
      return new Big(x).eq(y);
    } catch {
      return x === y;
    }
  };
  const different = keys
    .filter((k) => !sameValue(a.get(k), b.get(k)))
    .map((k) => ({ key: k, v1: a.get(k), v2: b.get(k) }));
  return { equal: keys.length - different.length, different };
}
