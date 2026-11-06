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
      // Map D slice 2 (architecture.md §10): Andamento's pages in their place; a tracker by
      // its area is `app/(app)/andamento/[tracker]` (it needs the kind's domain).
      ...["obiettivi", "qualita", "come-valutiamo"].map((p) => ({
        source: `/andamento/${p}/:rest*`,
        destination: `/oggi/andamento/${p}/:rest*`,
        permanent: false,
      })),
      {
        source: "/andamento/legami",
        destination: "/mente/andamento/legami",
        permanent: false,
      },
      { source: "/andamento/soldi", destination: "/soldi/andamento", permanent: false },
      // Change 2026-11-06-tracker: his trackers are a section of Oggi · Elenco.
      { source: "/profilo/tipi", destination: "/oggi/elenco#tracker", permanent: false },
      {
        source: "/impostazioni/tipi",
        destination: "/oggi/elenco#tracker",
        permanent: false,
      },
      { source: "/impostazioni", destination: "/profilo", permanent: false },
      {
        source: "/impostazioni/:rest+",
        destination: "/profilo/:rest+",
        permanent: false,
      },
      // Map D slice 3: each object under its area.
      ...[
        ["/libreria/cibo", "/cibo/cibo"],
        ["/libreria/pasto", "/cibo/pasto"],
        ["/libreria/esercizio", "/corpo/esercizio"],
        ["/libreria/tragitto", "/corpo/tragitto"],
        ["/piano/ciclo", "/corpo/ciclo"],
        ["/piano/abitudine", "/mente/abitudine"],
        ["/piano/modello", "/oggi/giornata"],
      ].map(([from, to]) => ({
        source: from + "/:rest+",
        destination: to + "/:rest+",
        permanent: false,
      })),
      { source: "/palestra/:id", destination: "/corpo/sessione/:id", permanent: false },
      {
        source: "/libreria/dispensa",
        destination: "/cibo/elenco?vista=dispensa",
        permanent: false,
      },
      {
        source: "/libreria/tragitto",
        destination: "/corpo/elenco?vista=tragitti",
        permanent: false,
      },
    ];
  },
};

export default config;
