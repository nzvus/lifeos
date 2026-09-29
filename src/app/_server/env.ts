/**
 * app/_server/env.ts — reads and validates environment variables, ONCE.
 *
 * Why validate: a missing secret should fail loudly at first use with a clear
 * message ("BETTER_AUTH_SECRET: ..."), not produce a half-working app. Why
 * lazily (a function, not a top-level constant): `next build` loads modules
 * without production secrets; reading them only when a request needs them
 * keeps the build independent of secrets.
 *
 * Folder note: `_server` starts with "_", which Next.js treats as private —
 * never a route. `import "server-only"` makes the build FAIL if a client
 * component ever imports this file, so secrets can't leak into the browser.
 *
 * Variable list and meaning: .env.example. Where they are set: .env locally,
 * Vercel project settings in production (docs/runbooks/setup.md).
 */
import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "must be at least 32 characters (openssl rand -base64 32)"),
  BETTER_AUTH_URL: z.url().optional(),
  ALLOW_SIGNUP: z.enum(["true", "false"]).default("false"),
  // Set automatically by Vercel (https://vercel.com/docs/environment-variables/system-environment-variables).
  VERCEL_URL: z.string().optional(), // this deployment, e.g. lifeos-abc123.vercel.app
  VERCEL_BRANCH_URL: z.string().optional(), // stable URL of a git branch's previews
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(), // production domain
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
});

export type Env = z.infer<typeof schema> & {
  /** Where the app is reached: used by Better Auth for cookies and redirects. */
  baseURL: string;
  /** Every URL a browser may legitimately call the auth endpoints from. */
  trustedOrigins: string[];
};

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // List every problem at once; only variable NAMES, never values.
    const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment variables:\n  ${problems.join("\n  ")}`);
  }
  const e = parsed.data;
  const https = (host?: string) => (host ? `https://${host}` : undefined);
  const baseURL =
    e.BETTER_AUTH_URL ??
    https(e.VERCEL_PROJECT_PRODUCTION_URL) ??
    https(e.VERCEL_URL) ??
    "http://localhost:3000";
  const trustedOrigins = [
    baseURL,
    https(e.VERCEL_URL),
    https(e.VERCEL_BRANCH_URL),
    https(e.VERCEL_PROJECT_PRODUCTION_URL),
  ].filter((x): x is string => x !== undefined);
  cached = { ...e, baseURL, trustedOrigins };
  return cached;
}
