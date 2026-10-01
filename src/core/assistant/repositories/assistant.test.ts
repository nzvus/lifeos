/** Tests for the assistant's key and conversations (ADR-0018). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import { userSettings } from "../../db/schema";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import {
  addMessage,
  clearKey,
  createConversation,
  deleteConversation,
  getApiKey,
  getConversation,
  getKeyStatus,
  listConversations,
  saveKey,
} from "./assistant";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;
const SECRET = "test-secret-at-least-32-characters-long";

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

describe("the key", () => {
  it("is stored encrypted, shown by its last 4, and read only with the secret", async () => {
    expect(await getKeyStatus(db, me)).toEqual({
      set: false,
      last4: null,
      model: "openrouter/free",
    });
    await saveKey(
      db,
      me,
      { key: "sk-or-v1-secretabcd", model: "openrouter/free" },
      SECRET,
    );
    expect(await getKeyStatus(db, me)).toEqual({
      set: true,
      last4: "abcd",
      model: "openrouter/free",
    });
    const [row] = await db.select().from(userSettings);
    expect(row?.assistantKeyEnc).not.toContain("sk-or");
    expect(await getApiKey(db, me, SECRET)).toBe("sk-or-v1-secretabcd");
    expect(await getApiKey(db, me, "a-different-secret-a-different-xx")).toBeNull();
    // Changing only the model keeps the key.
    await saveKey(db, me, { key: null, model: "some/model" }, SECRET);
    expect(await getKeyStatus(db, me)).toMatchObject({ set: true, model: "some/model" });
    // CROSS-USER: not theirs.
    expect(await getApiKey(db, other, SECRET)).toBeNull();
    await clearKey(db, me);
    expect((await getKeyStatus(db, me)).set).toBe(false);
  });
});

describe("conversations", () => {
  it("hold messages in order, mine only, and go to the trash", async () => {
    const c = await createConversation(db, me, "Spesa");
    await addMessage(db, me, c.id, { role: "user", content: "ciao" });
    await addMessage(db, me, c.id, {
      role: "assistant",
      content: "ciao!",
      toolCalls: [{ id: "x" }],
    });
    expect((await getConversation(db, me, c.id))?.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
    ]);
    // CROSS-USER: they can't read or write it.
    expect(await getConversation(db, other, c.id)).toBeNull();
    expect((await addMessage(db, other, c.id, { role: "user", content: "x" })).ok).toBe(
      false,
    );
    expect(await listConversations(db, other)).toEqual([]);
    await deleteConversation(db, me, c.id);
    expect(await listConversations(db, me)).toEqual([]);
  });
});
