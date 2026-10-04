/**
 * app/layout.tsx — the ROOT layout: the <html> and <body> every page shares.
 *
 * Next.js App Router: a `layout.tsx` wraps every page in its folder and
 * sub-folders. This one wraps everything; (auth)/ and (app)/ add their own.
 * Folders in parentheses are "route groups": they organise files and share
 * layouts but do NOT appear in the URL — (app)/ingredients is /ingredients.
 *
 * Fonts are self-hosted npm packages (@fontsource): imported CSS files that
 * ship the font files with the app. No request to Google, works offline.
 */
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./globals.css";
import { RegisterServiceWorker } from "@/app/_client/RegisterServiceWorker";
import { getDisplay } from "@/app/_server/display";
import { getTheme } from "@/app/_server/owner";
import { BROWSER_COLORS } from "@/design/browser-colors";
import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { DEFAULT_THEME } from "@/core/shared/themes";
import { dictionaries } from "@/i18n";

export const metadata: Metadata = {
  title: dictionaries[DEFAULT_LOCALE].app.name,
  // A personal app: ask search engines not to index it.
  robots: { index: false, follow: false },
  description: dictionaries[DEFAULT_LOCALE].app.description,
  // ADR-0019: installable. On iPhone "Add to Home Screen" reads these.
  appleWebApp: { capable: true, title: dictionaries[DEFAULT_LOCALE].app.name },
};

/** Page width a phone lays out when "desktop" is forced: --container-wide + margins. */
const DESKTOP_VIEWPORT_WIDTH = 1200;

export async function generateViewport(): Promise<Viewport> {
  const { mode, layout } = await getDisplay();
  return {
    // "desktop" on a phone: lay the page out as wide as a desktop and let the
    // browser zoom out to fit, like "request desktop site".
    ...(layout === "desktop"
      ? // initialScale must be present AND undefined: Next's default (1)
        // would otherwise stay, and the phone would show the page at 100 %
        // zoom (only its top-left corner) instead of the whole width.
        { width: DESKTOP_VIEWPORT_WIDTH, initialScale: undefined }
      : { width: "device-width", initialScale: 1 }),
    // Lets the page use the full screen on phones with a notch/home indicator;
    // the bottom tab bar pads itself with env(safe-area-inset-bottom).
    viewportFit: "cover",
    // The phone's status bar: the default theme's paper, in the mode chosen
    // in Settings, else the system's.
    themeColor:
      mode === "system"
        ? [
            { media: "(prefers-color-scheme: light)", color: BROWSER_COLORS.light },
            { media: "(prefers-color-scheme: dark)", color: BROWSER_COLORS.dark },
          ]
        : BROWSER_COLORS[mode],
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Per-device display settings (ADR-0010), from cookies, rendered on the
  // server so the first paint already has the right palette and layout.
  // The defaults ("system", "auto") are the absence of the attribute.
  const { mode, layout, density } = await getDisplay();
  // The user's theme (ADR-0010); the default one needs no attribute.
  const theme = await getTheme();
  // `lang` is the default locale; signed-in pages set their own on their wrapper.
  return (
    <html
      lang={DEFAULT_LOCALE}
      data-theme={theme === DEFAULT_THEME ? undefined : theme}
      data-mode={mode === "system" ? undefined : mode}
      data-layout={layout === "auto" ? undefined : layout}
      data-density={density}
    >
      <body className="min-h-dvh">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
