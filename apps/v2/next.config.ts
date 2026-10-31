/**
 * next.config.ts — lifeos v2. Kept short, each option with its reason.
 */
import type { NextConfig } from "next";

const config: NextConfig = {
  // Postgres drivers stay plain Node modules: pg's optional native bindings,
  // and PGlite's WASM and data files, which a bundle would break.
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  // The kit is TypeScript source in the workspace (packages/kit): Next compiles it.
  transpilePackages: ["@lifeos/kit"],
  // `next dev` would otherwise write its own agent block into CLAUDE.md.
  agentRules: false,
  // The dev badge sits on the NavBar's first place on a phone: off.
  devIndicators: false,
  // Map D (ADR-0059): the old places are Oggi's tabs now; links and bookmarks keep working.
  async redirects() {
    return [
      { source: "/piano", destination: "/oggi/piano", permanent: false },
      { source: "/andamento", destination: "/oggi/andamento", permanent: false },
      { source: "/libreria", destination: "/oggi/elenco", permanent: false },
    ];
  },
};

export default config;
