/**
 * app/(auth)/layout.tsx — frame for the signed-OUT pages (sign-in, sign-up):
 * a narrow centred column with the app name. No navigation, no session check.
 */
import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { dictionaries } from "@/i18n";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const t = dictionaries[DEFAULT_LOCALE];
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-12">
      <p className="border-b-6 border-ink pb-1 font-display text-4xl font-extrabold">
        {t.app.name}
      </p>
      {children}
    </main>
  );
}
