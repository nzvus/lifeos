/**
 * app/_server/runtime.ts — the ONE database and the ONE auth instance of the
 * running app (the "composition root": where core's factories meet real config).
 *
 * core/ never reads the environment; it receives what it needs. This file
 * reads env (./env.ts), calls core's factories (createDb, createAuth), and
 * keeps the results.
 *
 * Why `globalThis`: in development, Next.js re-executes modules on every code
 * change (hot reload). A plain module-level variable would open a NEW
 * connection pool each time until Postgres refuses connections. Storing the
 * instances on globalThis survives reloads. In production it changes nothing.
 */
import "server-only";
import { createAuth, type Auth } from "@/core/auth/auth";
import { applyPack } from "@/core/catalog/apply";
import { starterPack } from "@/core/catalog/starter";
import { createDb, type Db } from "@/core/db/client";
import { ownerFromVerifiedSession } from "@/core/identity/owner";
import { DEFAULT_TIMEZONE } from "@/core/nutrition/repositories/settings";
import { todayIn } from "@/core/shared/dates";
import { env } from "./env";

const store = globalThis as unknown as { __lifeosDb?: Db; __lifeosAuth?: Auth };

export function getDb(): Db {
  store.__lifeosDb ??= createDb(env().DATABASE_URL);
  return store.__lifeosDb;
}

export function getAuth(): Auth {
  const e = env();
  store.__lifeosAuth ??= createAuth({
    db: getDb(),
    secret: e.BETTER_AUTH_SECRET,
    baseURL: e.baseURL,
    trustedOrigins: e.trustedOrigins,
    allowSignUp: e.ALLOW_SIGNUP === "true",
    requireInvite: e.SIGNUP_INVITES === "true",
    // ADR-0034: every new account starts from the starter pack. Not fatal:
    // without it the account works, and the pack can be imported later.
    onUserCreated: async (userId) => {
      try {
        await applyPack(
          getDb(),
          ownerFromVerifiedSession(userId), // Better Auth has just created it
          starterPack(),
          todayIn(DEFAULT_TIMEZONE),
        );
      } catch (err) {
        console.error("starter pack not applied", userId, err);
      }
    },
  });
  return store.__lifeosAuth;
}
