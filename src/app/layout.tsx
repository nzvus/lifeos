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
import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { dictionaries } from "@/i18n";

export const metadata: Metadata = {
  title: dictionaries[DEFAULT_LOCALE].app.name,
  // A personal app: ask search engines not to index it.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // `lang` is the default locale; signed-in pages set their own on their wrapper.
  return (
    <html lang={DEFAULT_LOCALE}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
