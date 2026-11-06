/**
 * URL /manifest.webmanifest: what makes v2 installable («Aggiungi a
 * schermata Home»), as v1's (ADR-0019): its name, icons and a window
 * without the browser's bars. Colours are the dark paper: the phone reads
 * this file at install, without knowing the theme, and a dark splash is
 * gentler than a white flash. No service worker: pages and data always
 * come from the network, which is what v2 does today.
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "lifeos",
    short_name: "lifeos",
    description: "Cibo, allenamento e giornata in un posto solo.",
    start_url: "/oggi",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#111714",
    theme_color: "#111714",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
