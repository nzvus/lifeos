/**
 * next.config.ts — Next.js build/runtime configuration.
 *
 * Kept almost empty on purpose: every option here is framework-specific
 * behaviour that someone must remember after a three-week gap (ADR-0001's
 * "resumability" argument). Add options only with a comment saying why.
 */
import type { NextConfig } from "next";

const config: NextConfig = {
  // `pg` (the Postgres driver used by core/db/client.ts) uses Node APIs and
  // optional native bindings; telling Next not to bundle it avoids build noise
  // and keeps it as a plain `require` at runtime on Vercel's Node functions.
  serverExternalPackages: ["pg"],
};

export default config;
