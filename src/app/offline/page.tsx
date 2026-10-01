/**
 * app/offline/page.tsx — URL /offline: what the service worker shows when a
 * page can't be loaded without a network (ADR-0019). Cached once, so it
 * speaks every language and holds no user data.
 */
import { WifiOff } from "lucide-react";
import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { dictionaries } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { CARD } from "@/ui/Card";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex max-w-page flex-col gap-4 p-4 pt-12">
      {Object.entries(dictionaries)
        // The default language first.
        .sort(([a]) => (a === DEFAULT_LOCALE ? -1 : 0))
        .map(([locale, { app }]) => (
          <section key={locale} lang={locale} className={CARD}>
            <h1 className="section-heading">
              <span className="section-icon">
                <WifiOff size={20} aria-hidden="true" />
              </span>
              {app.offline}
            </h1>
            <p>{app.offlineHint}</p>
            {/* A plain link, not <Link>: a full reload tries the network again. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={`self-start ${buttonClass({ variant: "primary" })}`}>
              {app.retry}
            </a>
          </section>
        ))}
    </main>
  );
}
