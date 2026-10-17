/**
 * core/identity/local-admin.ts — an Owner without a session, for scripts run
 * on your own machine (as v1's). Whoever runs them already holds the
 * database itself. The web app never imports this file:
 *   grep -rn "local-admin" src/app src/features   → must print nothing.
 */
import { eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { user } from "../db/schema";
import { ownerFromVerifiedSession, type Owner } from "./owner";

export async function ownerByEmailForLocalScript(
  db: Db,
  email: string,
): Promise<Owner | null> {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  return row ? ownerFromVerifiedSession(row.id) : null;
}
