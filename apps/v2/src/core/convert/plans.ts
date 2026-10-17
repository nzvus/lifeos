/**
 * The converter's plans, goals and decisions (migration.md "Mapping"):
 * settings; day types and their programs become day models with blocks;
 * training programs become cycles; goals keep their history; what the person
 * decided (closed days, accepted check-ins, skips, overrides, fixed days)
 * becomes decisions. v1's learnt corrections are dropped: E4 learns from the
 * whole history.
 */
import type { CatalogMaps } from "./catalog";
import type { Out, V1Export, V1Row } from "./context";
import { dec, idFor, intOf, iso, str } from "./context";

const rows = (v1: V1Export, t: string): V1Row[] => v1.tables[t] ?? [];
const S = (x: unknown) => String(x);
const TARGETS = [
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fiber",
  "salt",
] as const;
const numbers = (r: V1Row) =>
  Object.fromEntries(
    TARGETS.flatMap((k) =>
      dec(r[k]) === null ? [] : [[k === "fiber" ? "fibre" : k, dec(r[k])]],
    ),
  );

export function convertPlans(v1: V1Export, out: Out, _maps: CatalogMaps): void {
  const settings = rows(v1, "user_settings")[0];
  if (settings) {
    const prefs: Record<string, unknown> = {};
    for (const k of [
      "autoTargets",
      "lunchFrom",
      "snackFrom",
      "dinnerFrom",
      "trendsRange",
      "listSort",
      "listPer",
    ])
      if (settings[k] !== null && settings[k] !== undefined) prefs[k] = settings[k];
    out.push("settings", {
      timezone: S(settings["timezone"] ?? "Europe/Rome"),
      locale: S(settings["locale"] ?? "it"),
      theme: S(settings["theme"] ?? "label"),
      sex:
        settings["sex"] === "male" || settings["sex"] === "female"
          ? settings["sex"]
          : null,
      birthYear: intOf(settings["birthYear"]),
      heightCm: dec(settings["heightCm"]),
      prefs,
    });
    const targets = TARGETS.filter(
      (k) => settings[k] !== null && settings[k] !== undefined,
    ).length;
    out.drop("user_settings.targets", targets, "targets come from goals (E5)");
    out.drop(
      "user_settings.energyCorrection",
      settings["energyCorrection"] ? 1 : 0,
      "the factor is learnt (E4)",
    );
    out.drop(
      "user_settings.assistant",
      settings["assistantModel"] || settings["assistantKeyLast4"] ? 1 : 0,
      "the assistant is parked",
    );
  }

  // Day types → day models; the default one lays out every weekday.
  const programs = new Map(rows(v1, "day_programs").map((p) => [S(p["profileId"]), p]));
  const slots = new Map<string, V1Row[]>();
  for (const s of rows(v1, "day_program_slots"))
    slots.set(S(s["profileId"]), [...(slots.get(S(s["profileId"])) ?? []), s]);
  for (const p of rows(v1, "day_profiles")) {
    const id = S(p["id"]);
    const program = programs.get(id);
    out.push("templates", {
      id,
      scope: "day",
      name: S(p["name"]),
      targets: {
        mode: p["mode"],
        ...numbers(p),
        deficitKcal: p["deficitKcal"] ?? null,
        proteinGPerKg: p["proteinGPerKg"] ?? null,
        fatGPerKg: p["fatGPerKg"] ?? null,
        ...(program ? { shiftKcal: program["shiftKcal"] ?? null } : {}),
      },
      deletedAt: iso(p["deletedAt"]),
      ...(iso(p["createdAt"]) ? { createdAt: iso(p["createdAt"])! } : {}),
    });
    let position = 0;
    for (const s of (slots.get(id) ?? []).sort(
      (a, b) => Number(a["position"]) - Number(b["position"]),
    ))
      out.push("template_blocks", {
        id: idFor("day_program_slots", id, S(s["position"])),
        templateId: id,
        position: position++,
        kind: "meal",
        when: s["at"] === null || s["at"] === undefined ? "unset" : "absolute",
        atMin: intOf(s["at"]),
        kcalShare: dec(s["kcalShare"]),
        proteinShare: dec(s["proteinShare"]),
        defaults: { role: s["kind"] },
      });
    if (program && program["trainingAt"] !== null && program["trainingAt"] !== undefined)
      out.push("template_blocks", {
        id: idFor("day_programs", id),
        templateId: id,
        position: position++,
        kind: "session",
        when: "absolute",
        atMin: intOf(program["trainingAt"]),
      });
    if (p["isDefault"] === true && !p["deletedAt"])
      for (let weekday = 1; weekday <= 7; weekday++)
        out.push("week_layouts", { weekday, templateId: id });
  }

  // A day's targets: a fixed copy is a decision; a dynamic one is computed again (live).
  let dynamic = 0;
  for (const d of rows(v1, "day_plans")) {
    if (d["mode"] !== "fixed") {
      dynamic++;
      continue;
    }
    out.push("decisions", {
      kind: "day_targets",
      day: S(d["day"]),
      key: "",
      payload: {
        profileId: d["profileId"] ?? null,
        profileName: d["profileName"] ?? null,
        ...numbers(d),
        deficitKcal: d["deficitKcal"] ?? null,
        proteinGPerKg: d["proteinGPerKg"] ?? null,
        fatGPerKg: d["fatGPerKg"] ?? null,
      },
    });
  }
  out.drop(
    "day_plans",
    dynamic,
    "dynamic days are computed again from the goal (E5), not copied",
  );

  // Goals: weight goals keep their history; the refined copy's v2 goals join them.
  for (const g of rows(v1, "goals")) {
    const metric = {
      source: "weight",
      goalKind: g["kind"] ?? null,
      ratePctWeek: g["ratePctWeek"] ?? null,
      kcalFloor: g["kcalFloor"] ?? null,
      protein: g["protein"] ?? null,
      split: g["split"] ?? null,
      checkInWeekday: g["checkInWeekday"] ?? null,
      weeklyCheckIn: g["weeklyCheckIn"] ?? null,
    };
    const target = dec(g["targetKg"]);
    const rate = dec(g["ratePctWeek"]) ?? "0";
    // With a target weight: reach it. Without one: a pace, as % a week of the trend weight.
    out.push(
      "goals",
      target !== null
        ? {
            metric,
            target: "reach",
            value: target,
            byDate: str(g["targetDay"]),
            sinceDay: S(g["sinceDay"]),
          }
        : Number(rate) === 0
          ? {
              metric: { ...metric, source: "weightRatePctWeek" },
              target: "range",
              low: "-0.05",
              high: "0.05",
              sinceDay: S(g["sinceDay"]),
            }
          : {
              metric: { ...metric, source: "weightRatePctWeek" },
              target: Number(rate) < 0 ? "at_most" : "at_least",
              value: rate,
              sinceDay: S(g["sinceDay"]),
            },
    );
  }
  for (const g of v1._v2?.goals ?? [])
    out.push("goals", {
      metric: {
        source: g.id,
        what: g.what,
        unit: g.unit,
        per: g.per,
        days: g.days ?? null,
        given: g.source,
      },
      target: "at_least",
      value: String(g.target),
      sinceDay: v1.exportedAt.slice(0, 10),
    });

  // Accepted weekly check-ins: frozen numbers for their week, with each day's shift.
  const shifts = new Map<string, V1Row[]>();
  for (const s of rows(v1, "week_checkin_days"))
    shifts.set(S(s["startDay"]), [...(shifts.get(S(s["startDay"])) ?? []), s]);
  let skipped = 0;
  for (const c of rows(v1, "week_checkins")) {
    if (c["decision"] !== "accepted") {
      skipped++;
      continue;
    }
    out.push("decisions", {
      kind: "week_targets",
      day: S(c["startDay"]),
      key: "",
      payload: {
        ...numbers(c),
        expenditureKcal: c["expenditureKcal"] ?? null,
        factor: c["factor"] ?? null,
        trendKg: c["trendKg"] ?? null,
        shifts: (shifts.get(S(c["startDay"])) ?? []).map((s) => ({
          day: s["day"],
          shiftKcal: s["shiftKcal"],
        })),
      },
    });
  }
  out.drop(
    "week_checkins",
    skipped,
    "check-ins not accepted (migration.md: accepted ones only)",
  );
  out.drop(
    "energy_corrections",
    rows(v1, "energy_corrections").length,
    "E4 learns the factor from the whole history",
  );

  for (const c of rows(v1, "day_closures"))
    out.push("decisions", {
      kind: "day_closed",
      day: S(c["day"]),
      key: "",
      payload: { state: c["state"] ?? null },
    });

  // Training programs → cycles: slots are steps; a slot's routines and exercises are its items.
  const slotItems = new Map<string, { position: number; item: string }[]>();
  const add = (slot: string, position: number, item: unknown) => {
    if (!item) return;
    slotItems.set(slot, [...(slotItems.get(slot) ?? []), { position, item: S(item) }]);
  };
  for (const i of rows(v1, "program_slot_items"))
    add(S(i["slotId"]), Number(i["position"] ?? 0), i["routineId"] ?? i["exerciseId"]);
  for (const x of rows(v1, "program_slot_exercises"))
    add(S(x["slotId"]), 1000, x["exerciseId"]);
  for (const p of rows(v1, "programs")) {
    const id = S(p["id"]);
    out.push("templates", {
      id,
      scope: "cycle",
      name: S(p["name"]),
      startDay: str(p["startDay"]),
      active: p["active"] !== false,
      targets: p["notes"] ? { notes: p["notes"] } : null,
      deletedAt: iso(p["deletedAt"]),
      ...(iso(p["createdAt"]) ? { createdAt: iso(p["createdAt"])! } : {}),
    });
    out.push("cycles_state", { cycleId: id, advance: "occurrence", onSkip: "lose" });
  }
  for (const s of rows(v1, "program_slots")) {
    const id = S(s["id"]);
    out.push("cycle_steps", {
      id,
      cycleId: S(s["programId"]),
      position: Number(s["position"] ?? 0),
      stepTemplateId: null,
      label: S(s["label"] ?? ""),
    });
    // v1's single routine of a slot (before ADR-0035) comes first.
    const items = [
      ...(s["routineId"] ? [{ position: -1, item: S(s["routineId"]) }] : []),
      ...(slotItems.get(id) ?? []),
    ];
    const seen = new Set<string>();
    let position = 0;
    for (const it of items.sort((a, b) => a.position - b.position)) {
      if (seen.has(it.item)) continue;
      seen.add(it.item);
      out.push("cycle_step_items", { stepId: id, position: position++, itemId: it.item });
    }
  }
  for (const k of rows(v1, "program_skips"))
    out.push("decisions", {
      kind: "cycle_skip",
      day: S(k["day"]),
      key: S(k["programId"]),
      payload: {},
    });
  for (const o of rows(v1, "program_overrides"))
    out.push("decisions", {
      kind: "cycle_override",
      day: S(o["day"]),
      key: S(o["programId"]),
      payload: { position: o["slotPosition"] ?? null },
    });

  // Reminders → chores: a block model with its recurrence; a done one also an entry.
  for (const r of rows(v1, "reminders")) {
    const id = S(r["id"]);
    const every = intOf(r["repeatDays"]);
    const start = str(r["dueDay"]) ?? S(r["createdAt"] ?? v1.exportedAt).slice(0, 10);
    out.push("templates", {
      id,
      scope: "block",
      name: S(r["text"]),
      recurrence: every
        ? { type: "everyN", n: every, start }
        : { type: "onDates", dates: [start] },
      deletedAt: iso(r["deletedAt"]),
    });
    out.push("template_blocks", {
      id: idFor("reminders", id),
      templateId: id,
      position: 0,
      kind: "chore",
      when: "unset",
    });
    const done = iso(r["doneAt"]);
    if (done)
      out.push("entries", {
        id: idFor("reminders.done", id),
        kind: "chore",
        day: done.slice(0, 10),
        status: "done",
        startAt: done,
        source: "import",
        note: S(r["text"]),
      });
  }
}
