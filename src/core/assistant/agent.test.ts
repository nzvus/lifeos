/**
 * Tests for the assistant's turn (ADR-0018) with a scripted fake model and
 * a real PGlite database: tools act through core with the session's owner,
 * writes are reported for Undo, confirm tools wait, bad calls never throw.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { getDay } from "../nutrition/repositories/log";
import { createIngredient, listIngredients } from "../nutrition/repositories/ingredients";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";
import { listTrash, restoreFromTrash } from "../trash/trash";
import { runConfirmed, runTurn, systemPrompt } from "./agent";
import type { ChatMessage, Complete, Completion } from "./model";
import { moveToTrash } from "../trash/trash";
import { getPantry } from "../pantry/repositories/stock";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

const DAY = "2026-10-01";
const ctx = (owner: Owner) => ({ db, owner, today: DAY, timeZone: "Europe/Rome" });

/** A model that answers with the given completions, in order, and records what it saw. */
function scripted(...answers: Completion[]): Complete & { seen: ChatMessage[][] } {
  const seen: ChatMessage[][] = [];
  const f = (async ({ messages }: { messages: ChatMessage[] }) => {
    seen.push([...messages]); // a copy: the agent keeps appending to its history
    return answers.shift() ?? { content: "…", toolCalls: [] };
  }) as unknown as Complete & { seen: ChatMessage[][] };
  f.seen = seen;
  return f;
}
const call = (id: string, name: string, args: unknown) => ({
  id,
  type: "function" as const,
  function: { name, arguments: JSON.stringify(args) },
});
const user = (text: string): ChatMessage[] => [
  { role: "system", content: systemPrompt(DAY, "it") },
  { role: "user", content: text },
];

describe("runTurn", () => {
  it("creates an ingredient from a label and reports it for Undo", async () => {
    const model = scripted(
      {
        content: null,
        toolCalls: [
          call("c1", "create_ingredient", {
            name: "Skyr",
            unit: "g",
            kcal: 62,
            protein: 11,
            carbs: 4,
            sugars: 4,
            fat: 0.2,
            saturatedFat: 0.1,
            fiber: 0,
            salt: 0.1,
          }),
        ],
      },
      { content: "Fatto: Skyr creato.", toolCalls: [] },
    );
    const r = await runTurn({
      complete: model,
      model: "test",
      messages: user("crea skyr"),
      ctx: ctx(me),
    });
    expect(r.changes).toEqual([
      {
        tool: "create_ingredient",
        kind: "ingredient",
        id: expect.any(String),
        label: "Skyr",
      },
    ]);
    expect((await listIngredients(db, me)).map((i) => [i.name, i.protein])).toEqual([
      ["Skyr", "11.000"],
    ]);
    // The model saw the tool's result before answering.
    expect(model.seen[1]!.at(-1)).toMatchObject({ role: "tool", tool_call_id: "c1" });
    expect(r.messages.at(-1)).toEqual({
      role: "assistant",
      content: "Fatto: Skyr creato.",
    });
    // Undo = to the trash, like everywhere.
    expect((await moveToTrash(db, me, "ingredient", r.changes[0]!.id)).ok).toBe(true);
    expect(await listIngredients(db, me)).toEqual([]);
  });

  it("validates like the forms: a wrong value is an error for the model, not a crash", async () => {
    const model = scripted(
      {
        content: null,
        toolCalls: [
          call("c1", "create_ingredient", { name: "X", unit: "kg", kcal: "lots" }),
        ],
      },
      { content: "Mi servono i valori dell'etichetta.", toolCalls: [] },
    );
    const r = await runTurn({
      complete: model,
      model: "test",
      messages: user("crea x"),
      ctx: ctx(me),
    });
    expect(r.changes).toEqual([]);
    const toolMsg = r.messages.find((m) => m.role === "tool") as { content: string };
    expect(JSON.parse(toolMsg.content)).toMatchObject({
      ok: false,
      error: { unit: "invalid_choice", kcal: "invalid_number" },
    });
  });

  it("logs food only for the session's owner", async () => {
    const oats = await createIngredient(db, me, ingredientFixture());
    if (!oats.ok) throw new Error("setup");
    const args = { day: DAY, ingredientId: oats.value.id, quantity: 60 };
    // Someone else's assistant can't log my ingredient.
    const theirs = await runTurn({
      complete: scripted(
        { content: null, toolCalls: [call("c1", "log_food", args)] },
        { content: "no", toolCalls: [] },
      ),
      model: "test",
      messages: user("x"),
      ctx: ctx(other),
    });
    expect(theirs.changes).toEqual([]);
    expect((await getDay(db, me, DAY)).entries).toEqual([]);
    const mine = await runTurn({
      complete: scripted(
        { content: null, toolCalls: [call("c1", "log_food", args)] },
        { content: "ok", toolCalls: [] },
      ),
      model: "test",
      messages: user("x"),
      ctx: ctx(me),
    });
    expect(mine.changes.map((c) => c.kind)).toEqual(["logEntry"]);
    expect((await getDay(db, me, DAY)).totals.nutrients.kcal).toBe("223.2");
  });

  it("a confirm tool waits with a preview; yes does it; every call is answered", async () => {
    const oats = await createIngredient(db, me, ingredientFixture());
    if (!oats.ok) throw new Error("setup");
    const r = await runTurn({
      complete: scripted({
        content: "Lo sposto nel cestino?",
        toolCalls: [
          call("c1", "move_to_trash", {
            kind: "ingredient",
            id: oats.value.id,
            label: "Oats",
          }),
          call("c2", "get_pantry", {}),
        ],
      }),
      model: "test",
      messages: user("elimina oats"),
      ctx: ctx(me),
    });
    expect(r.pending).toMatchObject({ name: "move_to_trash", toolCallId: "c1" });
    expect(r.messages.filter((m) => m.role === "tool")).toHaveLength(2);
    expect(await listIngredients(db, me)).toHaveLength(1); // nothing yet
    expect((await runConfirmed(ctx(me), r.pending!)).ok).toBe(true);
    expect((await listTrash(db, me)).map((x) => x.name)).toEqual(["Oats"]);
    // CROSS-USER: confirming as someone else does nothing.
    await restoreFromTrash(db, me, "ingredient", oats.value.id);
    expect((await runConfirmed(ctx(other), r.pending!)).ok).toBe(false);
  });

  it("gym notes: a preview first, then the session", async () => {
    const text = "Lat pulldown\n10 da 60\n2x9 da 55\nCompiuto in 50 min";
    const r = await runTurn({
      complete: scripted({
        content: null,
        toolCalls: [
          call("c1", "import_gym_notes", {
            label: "PULL",
            day: DAY,
            time: "18:30",
            text,
          }),
        ],
      }),
      model: "test",
      messages: user("registra"),
      ctx: ctx(me),
    });
    expect(r.pending?.preview).toMatchObject({
      exercises: [{ name: "Lat pulldown", sets: 3 }],
    });
    const done = await runConfirmed(ctx(me), r.pending!);
    expect(done).toMatchObject({ ok: true, data: { sessions: 1, exercises: 1 } });
  });

  it("an unknown tool or bad JSON never throws, and the turn has a step limit", async () => {
    const loop: Completion = {
      content: null,
      toolCalls: [
        { id: "x", type: "function", function: { name: "nope", arguments: "{bad" } },
      ],
    };
    const model = scripted(loop, loop, loop, loop);
    const r = await runTurn({
      complete: model,
      model: "test",
      messages: user("x"),
      ctx: ctx(me),
      maxSteps: 3,
    });
    expect(model.seen).toHaveLength(3);
    expect(r.pending).toBeNull();
  });

  it("a receipt: product + purchase, the pantry sees it, both undoable", async () => {
    const oats = await createIngredient(db, me, ingredientFixture());
    if (!oats.ok) throw new Error("setup");
    const model = scripted(
      {
        content: null,
        toolCalls: [
          call("c1", "create_product", {
            name: "AVENA 1KG",
            unit: "g",
            packageSize: 1000,
            ingredientId: oats.value.id,
          }),
        ],
      },
      { content: null, toolCalls: [call("c2", "find_products", { query: "avena" })] },
      { content: "Registrato.", toolCalls: [] },
    );
    const r = await runTurn({
      complete: model,
      model: "test",
      messages: user("scontrino"),
      ctx: ctx(me),
    });
    const productId = r.changes[0]!.id;
    const buy = await runTurn({
      complete: scripted(
        {
          content: null,
          toolCalls: [
            call("c3", "add_purchase", { productId, packages: 2, price: 3.18, day: DAY }),
          ],
        },
        { content: "ok", toolCalls: [] },
      ),
      model: "test",
      messages: user("x"),
      ctx: ctx(me),
    });
    expect([...r.changes, ...buy.changes].map((c) => c.kind)).toEqual([
      "product",
      "purchase",
    ]);
    const pantry = await getPantry(db, me, new Date("2026-10-02T00:00:00Z"));
    expect(pantry.map((i) => [i.name, i.quantity])).toEqual([["Oats", "2000"]]);
  });

  it("get_targets: no day type → no targets, and the energy needs body data", async () => {
    const r = await runTurn({
      complete: scripted(
        { content: null, toolCalls: [call("c1", "get_targets", {})] },
        { content: "ok", toolCalls: [] },
      ),
      model: "test",
      messages: user("x"),
      ctx: ctx(me),
    });
    const toolMsg = r.messages.find((m) => m.role === "tool") as { content: string };
    expect(JSON.parse(toolMsg.content)).toMatchObject({
      ok: true,
      data: { targets: null, energy: null },
    });
  });

  it("lookup_barcode: the injected lookup, digits only; missing → an error for the model", async () => {
    const asked: string[] = [];
    const lookupBarcode = async (code: string) => {
      asked.push(code);
      return code === "3017620422003"
        ? {
            barcode: code,
            name: "Nutella",
            description: "Ferrero",
            unit: "g" as const,
            kcal: "539",
            protein: "6.3",
            carbs: "57.5",
            sugars: "56.3",
            fat: "30.9",
            saturatedFat: "10.6",
            fiber: "",
            salt: "0.107",
            packageSize: "400",
            nova: "4",
          }
        : null;
    };
    const r = await runTurn({
      complete: scripted(
        {
          content: null,
          toolCalls: [
            call("c1", "lookup_barcode", { barcode: "3017620 422003" }),
            call("c2", "lookup_barcode", { barcode: "12345678" }),
            call("c3", "lookup_barcode", { barcode: "12" }),
          ],
        },
        { content: "ok", toolCalls: [] },
      ),
      model: "test",
      messages: user("x"),
      ctx: { ...ctx(me), lookupBarcode },
    });
    const results = r.messages
      .filter((m) => m.role === "tool")
      .map((m) => JSON.parse((m as { content: string }).content));
    expect(results[0]).toMatchObject({
      ok: true,
      data: { name: "Nutella", kcal: "539" },
    });
    expect(results[1]).toMatchObject({ ok: false });
    expect(results[2]).toMatchObject({ ok: false });
    expect(asked).toEqual(["3017620422003", "12345678"]);
  });
});
