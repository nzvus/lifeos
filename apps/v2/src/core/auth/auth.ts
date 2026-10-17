/**
 * core/auth/auth.ts — the Better Auth instance, as v1's (ADR-0006): email
 * and password, users and sessions in v2's own database (ADR-0057). The
 * Next.js glue is in app/: the route mounts it, _server/runtime.ts makes
 * the one instance, _server/owner.ts turns a cookie into an Owner.
 *
 * Sign-up is closed unless ALLOW_SIGNUP says otherwise; v1's invitations
 * (ADR-0034) come to v2 when a second person does.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "../db/db";
import { account, rateLimit, session, user, verification } from "../db/schema";

export type AuthConfig = {
  db: Db;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  allowSignUp: boolean;
};

export function createAuth(config: AuthConfig) {
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins,
    database: drizzleAdapter(config.db, {
      provider: "pg",
      schema: { user, session, account, verification, rateLimit },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !config.allowSignUp,
      minPasswordLength: 10,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    // In Postgres: in-memory counters reset on every cold start (v1).
    rateLimit: { enabled: true, storage: "database" },
    advanced: {
      // Ids are Postgres UUIDs, like every other table.
      database: { generateId: "uuid" },
      useSecureCookies: config.baseURL.startsWith("https://"),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
