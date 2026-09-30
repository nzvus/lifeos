/**
 * app/(app)/error.tsx — shown when a signed-in page throws an UNEXPECTED error
 * (database unreachable, a bug). Expected problems (bad input) never get here:
 * they are returned as error codes and shown next to the field
 * (core/shared/result.ts).
 *
 * Must be a client component (Next.js requirement). It can't know the user's
 * locale (that needs the server, which just failed), so it uses the default.
 * `reset()` re-renders the page, which retries whatever failed.
 */
"use client";

import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { dictionaries } from "@/i18n";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = dictionaries[DEFAULT_LOCALE].errorPage;
  return (
    <section
      role="alert"
      className="flex flex-col items-start gap-3 rule-l-heavy border-tomato pl-4"
    >
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      <p>{t.body}</p>
      <button
        type="button"
        onClick={reset}
        className="rule-medium border-ink px-4 py-2 font-display font-semibold"
      >
        {t.retry}
      </button>
    </section>
  );
}
