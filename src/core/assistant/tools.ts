/**
 * core/assistant/tools.ts — what the assistant can do (ADR-0018): one tool
 * per user action, each a thin wrapper over the core the forms already use
 * — the same validation (zod inputs, fed strings like a form) and the same
 * repositories, always with the session's Owner. So the assistant can do
 * nothing a user couldn't, and never anything to another user's data.
 *
 * Effects:
 *   read     runs at once, changes nothing
 *   write    runs at once; returns { kind, id } so the UI offers Undo (trash)
 *   confirm  does NOT run: returns a preview; the user confirms, then
 *            `runConfirmed` does it (deletes, imports)
 */
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { listIngredients } from "../nutrition/repositories/ingredients";
import { createIngredient } from "../nutrition/repositories/ingredients";
import {
  entryTiming,
  getDay,
  logEstimate,
  logIngredient,
  logMeal,
} from "../nutrition/repositories/log";
import { createMeal, listMeals } from "../nutrition/repositories/meals";
import { getHistory } from "../nutrition/repositories/history";
import {
  estimateInput,
  ingredientInput,
  logIngredientInput,
  logMealInput,
  mealInput,
} from "../nutrition/validation";
import {
  addPurchase,
  createProduct,
  listProducts,
} from "../pantry/repositories/products";
import { createReminder } from "../pantry/repositories/reminders";
import { getPantry } from "../pantry/repositories/stock";
import { productInput, purchaseInput, reminderInput } from "../pantry/validation";
import { getDayTargets } from "../nutrition/repositories/profiles";
import { dynamicTargets } from "../energy/energy";
import { carbsGoodMax, trainingLoad } from "../nutrition/bands";
import { getCalibration, getDayEnergy } from "../energy/repositories/energy";
import { addDays } from "../shared/dates";
import { rank } from "../shared/search";
import { parseInput } from "../shared/validation";
import { parseGymLog, toPlannedSession } from "../import/gym-log";
import { applyTrainingImport, planTrainingImport } from "../import/training-apply";
import { listExercises } from "../training/repositories/exercises";
import { isTrashKind, moveToTrash, type TrashKind } from "../trash/trash";
import type { OffPrefill } from "../nutrition/off";
import type { ToolSpec } from "./model";

export type ToolContext = {
  db: Db;
  owner: Owner;
  today: string;
  timeZone: string;
  /** Open Food Facts by barcode; injected by the app (core does no network I/O). */
  lookupBarcode?: (code: string) => Promise<OffPrefill | null>;
};
export type ToolResult =
  | { ok: true; data: unknown; change?: { kind: TrashKind; id: string; label: string } }
  | { ok: false; error: unknown };
export type Effect = "read" | "write" | "confirm";

type Tool = {
  spec: ToolSpec;
  effect: Effect;
  /** read/write: do it. confirm: describe what would happen. */
  run: (ctx: ToolContext, args: Record<string, unknown>) => Promise<ToolResult>;
  /** confirm only: do it, after the user said yes. */
  confirmed?: (ctx: ToolContext, args: Record<string, unknown>) => Promise<ToolResult>;
};

/** Tool arguments come as JSON; the forms' validation wants strings. */
const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const strings = (o: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, str(o[k])]));

const fn = (
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[] = [],
): ToolSpec => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});
const S = (description: string) => ({ type: "string", description });
const N = (description: string) => ({ type: "number", description });
const B = (description: string) => ({ type: "boolean", description });

const NUTRIENTS = [
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fiber",
  "salt",
];

export const TOOLS: Record<string, Tool> = {
  find_ingredients: {
    effect: "read",
    spec: fn(
      "find_ingredients",
      "Search my ingredients by name. Returns id, name, unit and nutrients per 100 g/ml.",
      { query: S("words to search; empty = all") },
    ),
    async run({ db, owner }, a) {
      const all = await listIngredients(db, owner);
      const found = str(a.query)
        ? rank(all, str(a.query), (i) => ({
            text: `${i.name} ${i.description}`,
            name: i.name,
          }))
        : all;
      return {
        ok: true,
        data: found.slice(0, 15).map((i) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          per100: Object.fromEntries(NUTRIENTS.map((k) => [k, i[k as "kcal"]])),
        })),
      };
    },
  },
  find_meals: {
    effect: "read",
    spec: fn(
      "find_meals",
      "Search my meals by name or ingredient. Returns id, name and kcal/macros per serving.",
      { query: S("words to search; empty = all") },
    ),
    async run({ db, owner }, a) {
      const all = await listMeals(db, owner);
      const found = str(a.query)
        ? rank(all, str(a.query), (m) => ({
            text: `${m.name} ${m.lines.map((l) => l.ingredientName).join(" ")}`,
            name: m.name,
          }))
        : all;
      return {
        ok: true,
        data: found
          .slice(0, 15)
          .map((m) => ({ id: m.id, name: m.name, perServing: m.totals.nutrients })),
      };
    },
  },
  find_exercises: {
    effect: "read",
    spec: fn("find_exercises", "Search my exercises by name.", {
      query: S("words to search; empty = all"),
    }),
    async run({ db, owner }, a) {
      const all = await listExercises(db, owner);
      const found = str(a.query)
        ? rank(all, str(a.query), (e) => ({ text: e.name, name: e.name }))
        : all;
      return {
        ok: true,
        data: found.slice(0, 20).map((e) => ({ id: e.id, name: e.name, kind: e.kind })),
      };
    },
  },
  get_day: {
    effect: "read",
    spec: fn("get_day", "What is logged on a day (eaten and planned) and its totals.", {
      day: S("YYYY-MM-DD; empty = today"),
    }),
    async run({ db, owner, today }, a) {
      const v = await getDay(db, owner, str(a.day) || today);
      return {
        ok: true,
        data: {
          day: v.day,
          entries: v.entries.map((e) => ({
            id: e.id,
            label: e.label,
            status: e.status,
            servings: e.servings,
            kcal: e.totals.nutrients.kcal,
          })),
          eaten: v.totals.nutrients,
          withPlanned: v.withPlanned.nutrients,
        },
      };
    },
  },
  get_recent_days: {
    effect: "read",
    spec: fn(
      "get_recent_days",
      "Totals and targets of the last N days (eaten food), for advice.",
      { days: N("how many days back, 1–30") },
    ),
    async run({ db, owner, today }, a) {
      const n = Math.min(30, Math.max(1, Number(a.days) || 7));
      const h = await getHistory(db, owner, addDays(today, 1 - n), today);
      return {
        ok: true,
        data: h.map((d) => ({
          day: d.day,
          logged: d.logged,
          totals: d.totals.nutrients,
          targets: d.targets,
          dayType: d.dayType,
        })),
      };
    },
  },
  get_pantry: {
    effect: "read",
    spec: fn(
      "get_pantry",
      "What is at home: quantity and days left per food or product.",
      {},
    ),
    async run({ db, owner }) {
      return { ok: true, data: await getPantry(db, owner) };
    },
  },
  lookup_barcode: {
    effect: "read",
    spec: fn(
      "lookup_barcode",
      "Look up a packaged food on Open Food Facts by its barcode (EAN/UPC digits). Returns name, brand, unit, nutrients per 100 g/ml, package size and NOVA, to pass to create_ingredient after showing them to me.",
      { barcode: S("the digits under the bars") },
      ["barcode"],
    ),
    async run({ lookupBarcode }, a) {
      const code = str(a.barcode).replace(/\D/g, "");
      if (!/^\d{6,14}$/.test(code))
        return { ok: false, error: "A barcode has 6 to 14 digits." };
      if (!lookupBarcode) return { ok: false, error: "Barcode lookup is not available." };
      const found = await lookupBarcode(code);
      return found
        ? { ok: true, data: found }
        : { ok: false, error: `Code ${code} is not on Open Food Facts.` };
    },
  },
  create_ingredient: {
    effect: "write",
    spec: fn(
      "create_ingredient",
      "Create an ingredient from its nutrition label, values per 100 g (or 100 ml). Never invent values: use the label, or ask.",
      {
        name: S("name"),
        unit: S('"g" or "ml"'),
        kcal: N("kcal per 100"),
        protein: N("g"),
        carbs: N("g"),
        sugars: N("g, of which sugars"),
        fat: N("g"),
        saturatedFat: N("g, of which saturated"),
        fiber: N("g"),
        salt: N("g"),
        packagePrice: N("price of one package in euros (optional)"),
        packageSize: N("package size in g/ml (optional, with the price)"),
        description: S("optional note"),
      },
      ["name", "unit", ...NUTRIENTS],
    ),
    async run({ db, owner }, a) {
      const input = parseInput(
        ingredientInput,
        strings(a, [
          "name",
          "unit",
          "description",
          "packagePrice",
          "packageSize",
          ...NUTRIENTS,
        ]),
      );
      if (!input.ok) return { ok: false, error: input.errors };
      const { nova: _n, origin: _o, fiberTypes: _f, tags: _t, ...write } = input.value;
      const r = await createIngredient(db, owner, write);
      return r.ok
        ? {
            ok: true,
            data: { id: r.value.id },
            change: { kind: "ingredient", id: r.value.id, label: r.value.name },
          }
        : { ok: false, error: r.errors };
    },
  },
  create_meal: {
    effect: "write",
    spec: fn(
      "create_meal",
      "Create a meal (one serving) from my ingredients: find their ids first with find_ingredients.",
      {
        name: S("name"),
        notes: S("optional: preparation, notes"),
        category: S('optional: "breakfast" | "lunch" | "snack" | "dinner"'),
        items: {
          type: "array",
          items: {
            type: "object",
            properties: { ingredientId: S("id"), quantity: N("g or ml in one serving") },
            required: ["ingredientId", "quantity"],
          },
        },
      },
      ["name", "items"],
    ),
    async run({ db, owner }, a) {
      const items = Array.isArray(a.items)
        ? (a.items as Record<string, unknown>[]).map((i) =>
            strings(i, ["ingredientId", "quantity"]),
          )
        : [];
      const input = parseInput(mealInput, {
        name: str(a.name),
        notes: str(a.notes),
        category: str(a.category),
        items,
      });
      if (!input.ok) return { ok: false, error: input.errors };
      const r = await createMeal(db, owner, input.value);
      return r.ok
        ? {
            ok: true,
            data: { id: r.value.id },
            change: { kind: "meal", id: r.value.id, label: str(a.name) },
          }
        : { ok: false, error: r.errors };
    },
  },
  log_food: {
    effect: "write",
    spec: fn(
      "log_food",
      "Log a meal (servings) or a single ingredient (quantity in g/ml) on a day, eaten or planned.",
      {
        day: S("YYYY-MM-DD; empty = today"),
        mealId: S("a meal id (or give ingredientId)"),
        servings: N("servings of the meal, default 1"),
        ingredientId: S("an ingredient id (or give mealId)"),
        quantity: N("g or ml of the ingredient"),
        planned: B("true = planned, not eaten yet"),
        time: S("HH:MM, optional"),
        moment: S('optional: "breakfast" | "lunch" | "snack" | "dinner"'),
      },
    ),
    async run({ db, owner, today, timeZone }, a) {
      const base = {
        day: str(a.day) || today,
        planned: a.planned ? "on" : "",
        time: str(a.time),
        moment: str(a.moment),
      };
      if (str(a.mealId)) {
        const input = parseInput(logMealInput, {
          ...base,
          mealId: str(a.mealId),
          servings: str(a.servings) || "1",
        });
        if (!input.ok) return { ok: false, error: input.errors };
        const { planned, time, ...rest } = input.value;
        const r = await logMeal(db, owner, {
          ...rest,
          ...entryTiming(rest.day, planned, time, timeZone),
        });
        return r.ok
          ? {
              ok: true,
              data: r.value,
              change: { kind: "logEntry", id: r.value.id, label: rest.day },
            }
          : { ok: false, error: r.errors };
      }
      const input = parseInput(logIngredientInput, {
        ...base,
        ingredientId: str(a.ingredientId),
        quantity: str(a.quantity),
      });
      if (!input.ok) return { ok: false, error: input.errors };
      const { planned, time, ...rest } = input.value;
      const r = await logIngredient(db, owner, {
        ...rest,
        ...entryTiming(rest.day, planned, time, timeZone),
      });
      return r.ok
        ? {
            ok: true,
            data: r.value,
            change: { kind: "logEntry", id: r.value.id, label: rest.day },
          }
        : { ok: false, error: r.errors };
    },
  },
  log_estimate: {
    effect: "write",
    spec: fn(
      "log_estimate",
      "Log an estimated meal (eaten out, no recipe): kcal and optional nutrients (empty = 0).",
      {
        day: S("YYYY-MM-DD; empty = today"),
        label: S("what it was"),
        kcal: N("kcal"),
        protein: N("g"),
        carbs: N("g"),
        sugars: N("g, of which sugars"),
        fat: N("g"),
        saturatedFat: N("g, of which saturated"),
        fiber: N("g"),
        salt: N("g"),
        planned: B("planned, not eaten yet"),
        time: S("HH:MM optional"),
      },
      ["label", "kcal"],
    ),
    async run({ db, owner, today, timeZone }, a) {
      const input = parseInput(estimateInput, {
        ...strings(a, [
          "label",
          "kcal",
          "protein",
          "carbs",
          "sugars",
          "fat",
          "saturatedFat",
          "fiber",
          "salt",
          "time",
        ]),
        day: str(a.day) || today,
        planned: a.planned ? "on" : "",
        cost: "",
        moment: "",
      });
      if (!input.ok) return { ok: false, error: input.errors };
      const { planned, time, ...rest } = input.value;
      const r = await logEstimate(db, owner, {
        ...rest,
        ...entryTiming(rest.day, planned, time, timeZone),
      });
      return r.ok
        ? {
            ok: true,
            data: r.value,
            change: { kind: "logEntry", id: r.value.id, label: rest.label },
          }
        : { ok: false, error: r.errors };
    },
  },
  create_reminder: {
    effect: "write",
    spec: fn(
      "create_reminder",
      "Add a reminder, optionally due on a day and repeating every N days.",
      {
        text: S("what"),
        dueDay: S("YYYY-MM-DD optional"),
        repeatDays: N("repeat every N days, optional"),
      },
      ["text"],
    ),
    async run({ db, owner }, a) {
      const input = parseInput(
        reminderInput,
        strings(a, ["text", "dueDay", "repeatDays"]),
      );
      if (!input.ok) return { ok: false, error: input.errors };
      const r = await createReminder(db, owner, input.value);
      return r.ok
        ? {
            ok: true,
            data: r.value,
            change: { kind: "reminder", id: r.value.id, label: input.value.text },
          }
        : { ok: false, error: r.errors };
    },
  },
  find_products: {
    effect: "read",
    spec: fn(
      "find_products",
      "Search the products I buy (shelf items: brand, package size, linked ingredient).",
      { query: S("words to search; empty = all") },
    ),
    async run({ db, owner }, a) {
      const all = await listProducts(db, owner);
      const found = str(a.query)
        ? rank(all, str(a.query), (p) => ({
            text: `${p.name} ${p.brand} ${p.ingredientName ?? ""}`,
            name: p.name,
          }))
        : all;
      return {
        ok: true,
        data: found.slice(0, 20).map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          unit: p.unit,
          packageSize: p.packageSize,
          ingredientId: p.ingredientId,
          ingredient: p.ingredientName,
        })),
      };
    },
  },
  create_product: {
    effect: "write",
    spec: fn(
      "create_product",
      'A product as on the shelf or a receipt line ("PASSATA MUTTI 700G"): unit g, ml or piece; for food link its ingredient (find_ingredients first; pieces never link).',
      {
        name: S("name"),
        brand: S("optional"),
        unit: S('"g" | "ml" | "piece"'),
        packageSize: N("how much one package holds, in the unit"),
        ingredientId: S("optional ingredient id (food)"),
        shop: S("optional shop"),
      },
      ["name", "unit", "packageSize"],
    ),
    async run({ db, owner }, a) {
      const input = parseInput(
        productInput,
        strings(a, [
          "name",
          "brand",
          "unit",
          "packageSize",
          "ingredientId",
          "shop",
          "notes",
        ]),
      );
      if (!input.ok) return { ok: false, error: input.errors };
      const r = await createProduct(db, owner, input.value);
      return r.ok
        ? {
            ok: true,
            data: r.value,
            change: { kind: "product", id: r.value.id, label: input.value.name },
          }
        : { ok: false, error: r.errors };
    },
  },
  add_purchase: {
    effect: "write",
    spec: fn(
      "add_purchase",
      "Record a purchase of a product (one receipt line): packages bought and the total price paid in euros.",
      {
        productId: S("product id (find_products or create_product)"),
        day: S("YYYY-MM-DD; empty = today"),
        packages: N("how many packages, default 1"),
        price: N("total paid in euros, optional"),
        shop: S("optional"),
      },
      ["productId"],
    ),
    async run({ db, owner, today }, a) {
      const input = parseInput(purchaseInput, {
        ...strings(a, ["productId", "price", "shop"]),
        day: str(a.day) || today,
        packages: str(a.packages) || "1",
      });
      if (!input.ok) return { ok: false, error: input.errors };
      const r = await addPurchase(db, owner, input.value);
      return r.ok
        ? {
            ok: true,
            data: r.value,
            change: { kind: "purchase", id: r.value.id, label: `${input.value.day}` },
          }
        : { ok: false, error: r.errors };
    },
  },
  get_calibration: {
    effect: "read",
    spec: fn(
      "get_calibration",
      "The last 28 days against the energy model: average eaten, weight trend (kg/week), spent by the scale vs by the model, a verdict on the data and the proposed factor on everyday activity. Only the user can accept it (day page → Energy → Calibration).",
      {},
    ),
    async run({ db, owner, today }) {
      return { ok: true, data: await getCalibration(db, owner, today) };
    },
  },
  get_targets: {
    effect: "read",
    spec: fn(
      "get_targets",
      "The targets of a day (fixed, or dynamic from the energy model) and what the day costs, for planning meals.",
      { day: S("YYYY-MM-DD; empty = today") },
    ),
    async run({ db, owner, today }, a) {
      const day = str(a.day) || today;
      const [t, e] = await Promise.all([
        getDayTargets(db, owner, day),
        getDayEnergy(db, owner, day),
      ]);
      if (t.source === "none")
        return { ok: true, data: { targets: null, energy: e.energy } };
      const dynamic =
        t.dynamic && e.energy && e.body.weightKg
          ? dynamicTargets(
              e.energy,
              e.body.weightKg,
              t.dynamic,
              carbsGoodMax(
                Number(e.body.weightKg),
                trainingLoad(
                  e.energy.inputs.sessions.reduce((a, x) => a + x.durationMin, 0),
                  e.energy.inputs.sessions.reduce(
                    (a, x) => a + (x.basis?.kind === "sets" ? x.basis.cardioMin : 0),
                    0,
                  ),
                ),
              ),
            )
          : null;
      return {
        ok: true,
        data: {
          dayType: t.name,
          targets: dynamic ?? t.targets,
          dynamic: Boolean(dynamic),
          energy: e.energy,
          missingBody: e.missing,
        },
      };
    },
  },
  import_gym_notes: {
    effect: "confirm",
    spec: fn(
      "import_gym_notes",
      'Import a gym session from notes written like "Lat pulldown / 10 da 60 / 3x8 con 2 da 20 / Compiuto in 55 min". Shows a preview; the user confirms.',
      {
        label: S('session name, e.g. "PULL"'),
        day: S("YYYY-MM-DD; empty = today"),
        time: S("HH:MM start, optional"),
        text: S("the notes, as written"),
      },
      ["label", "text"],
    ),
    async run(ctx, a) {
      const plan = gymPlan(ctx, a);
      const preview = await planTrainingImport(ctx.db, ctx.owner, plan.input);
      return {
        ok: true,
        data: {
          preview,
          warnings: plan.warnings,
          exercises: plan.input.sessions[0]?.exercises.map((e) => ({
            name: e.name,
            sets: e.sets.length,
          })),
        },
      };
    },
    async confirmed(ctx, a) {
      const plan = gymPlan(ctx, a);
      const r = await applyTrainingImport(ctx.db, ctx.owner, plan.input, ctx.timeZone);
      return r.failed.length
        ? { ok: false, error: r.failed }
        : { ok: true, data: r.created };
    },
  },
  move_to_trash: {
    effect: "confirm",
    spec: fn(
      "move_to_trash",
      "Move a record to the trash (restorable for 30 days). kind: meal, ingredient, logEntry, dayProfile, session, routine, exercise, measurement, product, purchase, batch, reminder.",
      {
        kind: S("the kind"),
        id: S("the record's id"),
        label: S("its name, for the preview"),
      },
      ["kind", "id"],
    ),
    async run(_ctx, a) {
      return isTrashKind(str(a.kind))
        ? {
            ok: true,
            data: {
              willTrash: { kind: str(a.kind), id: str(a.id), label: str(a.label) },
            },
          }
        : { ok: false, error: "invalid_choice" };
    },
    async confirmed({ db, owner }, a) {
      const kind = str(a.kind);
      if (!isTrashKind(kind)) return { ok: false, error: "invalid_choice" };
      const r = await moveToTrash(db, owner, kind, str(a.id));
      return r.ok
        ? { ok: true, data: { trashed: true } }
        : { ok: false, error: r.errors };
    },
  },
};

/** Notes → the importer's plan: the parser wants a file name "LABEL_YYMMDD_HHMMSS.txt". */
function gymPlan({ today }: ToolContext, a: Record<string, unknown>) {
  const day = str(a.day) || today;
  const time = (str(a.time) || "00:00").replace(":", "") + "00";
  const fileName = `${str(a.label) || "Sessione"}_${day.slice(2).replaceAll("-", "")}_${time}.txt`;
  // The parser skips the first line (in the real files it is the heading,
  // e.g. "PULL"): add the label as that heading unless the notes start with it.
  const text = str(a.text);
  const firstLine = text.trim().split(/\r?\n/)[0]?.trim().toLowerCase() ?? "";
  const withHeading =
    firstLine === str(a.label).trim().toLowerCase() ? text : `${str(a.label)}\n${text}`;
  const parsed = parseGymLog(fileName, withHeading);
  return {
    warnings: parsed.warnings,
    input: { sessions: [toPlannedSession(parsed)], routines: [], measurements: [] },
  };
}

export const TOOL_SPECS: ToolSpec[] = Object.values(TOOLS).map((t) => t.spec);
