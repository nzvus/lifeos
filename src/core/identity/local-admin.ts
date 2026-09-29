/**
 * core/identity/local-admin.ts — get an Owner WITHOUT a login session, for
 * command-line scripts run on your own machine (e.g. scripts/import-fitforge.ts).
 *
 * Why this is acceptable: whoever runs such a script already holds the
 * database connection string, which grants full access to every row anyway.
 * The session requirement protects the WEB app, where requests come from
 * strangers; it adds nothing against someone who has the database password.
 *
 * Why it's a separate, loudly named file: the web app must never call it.
 * Nothing under src/app/ or src/features/ imports it — check with
 *   grep -rn "local-admin" src/app src/features
 * which must print nothing.
 */
import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { user } from "../db/schema";
import { ownerFromVerifiedSession, type Owner } from "./owner";

export async function ownerByEmailForLocalScript(
  db: Db,
  email: string,
): Promise<Owner | null> {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  return row ? ownerFromVerifiedSession(row.id) : null;
}
