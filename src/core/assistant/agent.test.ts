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
});
