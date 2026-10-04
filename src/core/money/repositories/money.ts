/**
 * core/money/repositories/money.ts — the ledger (ADR-0036): categories (a
 * starter set made on first use) and movements, owner-filtered, live only;
 * deletes go to the trash (ADR-0015).
 *
 * Tested in: money.test.ts (cross-user isolation, the starter set, the trash).
 */
import { and, asc, desc, eq, gte, isNotNull, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { moneyCategories, moneyMovements } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import type { Locale } from "../../shared/locales";
import { fail, ok, type Result } from "../../shared/result";
import { live } from "../../shared/trash";
import { nameIn, STARTER_CATEGORIES } from "../starter";
import type { MovementInput } from "../validation";

export type Category = typeof moneyCategories.$inferSelect;
export type Movement = typeof moneyMovements.$inferSelect;

/** My live categories, parents before children, in their order. */
export async function listCategories(db: Db, owner: Owner): Promise<Category[]> {
  return db
    .select()
    .from(moneyCategories)
    .where(and(ownedBy(moneyCategories, owner), live(moneyCategories)))
    .orderBy(asc(moneyCategories.kind), asc(moneyCategories.position));
}

/**
 * The starter categories, in the account's language, if the account has
 * none yet (any, live or in the trash: a ledger set up once stays as the
 * user left it). One transaction. Returns the live categories.
 */
export async function ensureCategories(
  db: Db,
  owner: Owner,
  locale: Locale,
): Promise<Category[]> {
  const [any] = await db
    .select({ id: moneyCategories.id })
    .from(moneyCategories)
    .where(ownedBy(moneyCategories, owner))
    .limit(1);
  if (!any) {
    await db.transaction(async (tx) => {
      let position = 0;
      for (const c of STARTER_CATEGORIES) {
        const [parent] = await tx
          .insert(moneyCategories)
          .values({
            userId: owner.id,
            kind: c.kind,
            key: c.key ?? null,
            name: nameIn(c.name, locale),
            icon: c.icon,
            position: position++,
          })
          .returning({ id: moneyCategories.id });
        for (const child of c.children ?? [])
          await tx.insert(moneyCategories).values({
            userId: owner.id,
            kind: c.kind,
            parentId: parent!.id,
            name: nameIn(child, locale),
            position: position++,
          });
      }
    });
  }
  return listCategories(db, owner);
}

/** A category of mine, live, of the movement's kind. */
async function checkCategory(
  db: Db,
  owner: Owner,
  input: MovementInput,
): Promise<Result<null>> {
  if (input.categoryId === null) return ok(null);
  const [c] = await db
    .select({ kind: moneyCategories.kind })
    .from(moneyCategories)
    .where(
      and(
        ownedBy(moneyCategories, owner),
        live(moneyCategories),
        eq(moneyCategories.id, input.categoryId),
      ),
    );
  if (!c) return fail({ categoryId: "not_found" });
  const kind = input.amountCents < 0 ? "expense" : "income";
  return c.kind === kind ? ok(null) : fail({ categoryId: "invalid_choice" });
}

export async function addMovement(
  db: Db,
  owner: Owner,
  input: MovementInput,
): Promise<Result<{ id: string }>> {
  const checked = await checkCategory(db, owner, input);
  if (!checked.ok) return checked;
  const [row] = await db
    .insert(moneyMovements)
    .values({ ...input, userId: owner.id })
    .returning({ id: moneyMovements.id });
  return ok({ id: row!.id });
}

export async function updateMovement(
  db: Db,
  owner: Owner,
  id: string,
  input: MovementInput,
): Promise<Result<null>> {
  const checked = await checkCategory(db, owner, input);
  if (!checked.ok) return checked;
  const done = await db
    .update(moneyMovements)
    .set(input)
    .where(
      and(
        ownedBy(moneyMovements, owner),
        live(moneyMovements),
        eq(moneyMovements.id, id),
      ),
    )
    .returning({ id: moneyMovements.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

export async function getMovement(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Movement | null> {
  const [row] = await db
    .select()
    .from(moneyMovements)
    .where(
      and(
        ownedBy(moneyMovements, owner),
        live(moneyMovements),
        eq(moneyMovements.id, id),
      ),
    );
  return row ?? null;
}

/** My live movements between two days (inclusive), newest first. */
export async function listMovements(
  db: Db,
  owner: Owner,
  from: string,
  to: string,
): Promise<Movement[]> {
  return db
    .select()
    .from(moneyMovements)
    .where(
      and(
        ownedBy(moneyMovements, owner),
        live(moneyMovements),
        gte(moneyMovements.day, from),
        lte(moneyMovements.day, to),
      ),
    )
    .orderBy(desc(moneyMovements.day), desc(moneyMovements.createdAt));
}

/** To the trash (ADR-0015). */
export async function deleteMovement(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(moneyMovements)
    .set({ deletedAt: new Date() })
    .where(
      and(
        ownedBy(moneyMovements, owner),
        live(moneyMovements),
        eq(moneyMovements.id, id),
      ),
    )
    .returning({ id: moneyMovements.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

export async function restoreMovement(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(moneyMovements)
    .set({ deletedAt: null })
    .where(
      and(
        ownedBy(moneyMovements, owner),
        isNotNull(moneyMovements.deletedAt),
        eq(moneyMovements.id, id),
      ),
    )
    .returning({ id: moneyMovements.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}
