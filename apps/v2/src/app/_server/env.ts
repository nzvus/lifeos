/**
 * app/_server/env.ts — v2's environment, read and checked once, lazily (so
 * `next build` needs no secrets), as v1's. Exactly one database: Neon's
 * branch `v2` (DATABASE_URL) or a local PGlite folder (V2_PGLITE_DIR).
 * The list and what each means: apps/v2/.env.example.
 */
import "server-only";
import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.string().min(1).optional(),
    V2_PGLITE_DIR: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "must be at least 32 characters (openssl rand -base64 32)"),
    BETTER_AUTH_URL: z.url().optional(),
    ALLOW_SIGNUP: z.enum(["true", "false"]).default("false"),
    VERCEL_URL: z.string().optional(),
    VERCEL_BRANCH_URL: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  })
  .refine((e) => (e.DATABASE_URL === undefined) !== (e.V2_PGLITE_DIR === undefined), {
    message: "set exactly one of DATABASE_URL and V2_PGLITE_DIR",
  });

export type Env = z.infer<typeof schema> & { baseURL: string; trustedOrigins: string[] };

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Names only, never values.
    const problems = parsed.error.issues.map(
      (i) => `${i.path.join(".") || "env"}: ${i.message}`,
    );
    throw new Error(`Invalid environment variables:\n  ${problems.join("\n  ")}`);
  }
  const e = parsed.data;
  const https = (host?: string) => (host ? `https://${host}` : undefined);
  const baseURL =
    e.BETTER_AUTH_URL ??
    https(e.VERCEL_PROJECT_PRODUCTION_URL) ??
    https(e.VERCEL_URL) ??
    "http://localhost:3200";
  const trustedOrigins = [
    baseURL,
    https(e.VERCEL_URL),
    https(e.VERCEL_BRANCH_URL),
    https(e.VERCEL_PROJECT_PRODUCTION_URL),
  ].filter((x): x is string => x !== undefined);
  cached = { ...e, baseURL, trustedOrigins };
  return cached;
}
