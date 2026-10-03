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
  // `next dev` would otherwise append its own agent block to CLAUDE.md on
  // every start; our agent instructions are hand-written and reviewed.
  agentRules: false,
  // The assistant (ADR-0018) may send up to 4 photos, each shrunk to
  // 1280 px JPEG (≈150–400 KB as a data URL): above the 1 MB default.
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    // Going back to a page seen in the last 30 s shows it at once from the
    // browser's router cache instead of asking the server again
    // (2026-10-03: "it takes 1 second to switch the pages"). Safe: every
    // server action calls revalidatePath, which empties that cache.
    staleTimes: { dynamic: 30 },
  },
};

export default config;
