/**
 * app/manifest.ts — URL /manifest.webmanifest: what makes Lifeos installable
 * ("Add to Home screen"): its name, icons and a window without the browser's
 * bars (ADR-0019). Colours are the default theme's DARK paper: the phone
 * fetches this file without cookies, at install, so it can't know the
 * user's mode; a dark splash is gentler than a white flash (developer's
 * choice, 2026-10-02).
 */
import type { MetadataRoute } from "next";
import { BROWSER_COLORS } from "@/design/browser-colors";
import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { dictionaries } from "@/i18n";

export default function manifest(): MetadataRoute.Manifest {
  const t = dictionaries[DEFAULT_LOCALE].app;
  return {
    name: t.name,
    short_name: t.name,
    description: t.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BROWSER_COLORS.dark,
    theme_color: BROWSER_COLORS.dark,
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
