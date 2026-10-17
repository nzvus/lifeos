/**
 * app/_server/runtime.ts — the one database and the one auth instance of
 * the running app (the composition root, as v1's). Kept on globalThis so a
 * dev reload does not open a new pool (or a second PGlite on the same
 * folder, which PGlite refuses).
 */
import "server-only";
import { createAuth, type Auth } from "@/core/auth/auth";
import { createDb, createLocalDb } from "@/core/db/client";
import type { Db } from "@/core/db/db";
import { env } from "./env";

const store = globalThis as unknown as { __v2Db?: Promise<Db>; __v2Auth?: Promise<Auth> };

export function getDb(): Promise<Db> {
  const e = env();
  store.__v2Db ??= e.DATABASE_URL
    ? Promise.resolve(createDb(e.DATABASE_URL))
    : createLocalDb(e.V2_PGLITE_DIR!);
  return store.__v2Db;
}

export function getAuth(): Promise<Auth> {
  const e = env();
  store.__v2Auth ??= getDb().then((db) =>
    createAuth({
      db,
      secret: e.BETTER_AUTH_SECRET,
      baseURL: e.baseURL,
      trustedOrigins: e.trustedOrigins,
      allowSignUp: e.ALLOW_SIGNUP === "true",
    }),
  );
  return store.__v2Auth;
}
