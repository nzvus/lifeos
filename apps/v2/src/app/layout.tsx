/**
 * The root layout: the kit's stylesheet and tokens for every page, Italian,
 * and the theme. The tokens hold light and dark ([data-theme]); a script
 * that runs before the page is interactive picks the system's (next/script,
 * beforeInteractive: React itself never runs a <script> it renders), or
 * the one chosen on this device.
 */
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@lifeos/kit/styles/tokens.css";
import "@lifeos/kit/styles/kit.css";
import "./app.css";

// The manifest (manifest.ts) and the icons (icon.svg, apple-icon.png) are
// linked by Next from their file names; iOS reads appleWebApp.
export const metadata: Metadata = {
  title: "lifeos",
  appleWebApp: { capable: true, title: "lifeos" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#111714" },
  ],
};

// The device's choice (Impostazioni → Tema) if any, else the system's.
const THEME = `(function(){var t;try{t=localStorage.getItem("theme")}catch(e){}document.documentElement.dataset.theme=t==="light"||t==="dark"?t:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">
          {THEME}
        </Script>
        {children}
      </body>
    </html>
  );
}
