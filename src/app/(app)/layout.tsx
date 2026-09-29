/**
 * app/(app)/layout.tsx — frame for every SIGNED-IN page: header, navigation,
 * one readable column.
 *
 * `requireContext()` runs here AND in each page and action. The layout's call
 * only protects what the layout renders; Next.js can render a page without
 * re-running its layout (e.g. on client navigation), so each page checks for
 * itself. `cache()` in _server/owner.ts makes the repeated calls free.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { requireContext } from "@/app/_server/owner";
import { SignOutButton } from "@/features/account/auth/SignOutButton";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { t, settings } = await requireContext();
  const links = [
    { href: "/", label: t.nav.today },
    { href: "/meals", label: t.nav.meals },
    { href: "/ingredients", label: t.nav.ingredients },
    { href: "/profiles", label: t.nav.profiles },
    { href: "/settings", label: t.nav.settings },
  ];
  return (
    <div
      lang={settings.locale}
      className="mx-auto flex max-w-page flex-col gap-6 px-4 pb-16"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-6 border-ink pt-4 pb-2">
        <Link href="/" className="font-display text-3xl font-extrabold">
          {t.app.name}
        </Link>
        <nav className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-display text-lg font-semibold underline-offset-4 hover:underline"
            >
              {l.label}
            </Link>
          ))}
          <SignOutButton label={t.nav.signOut} />
        </nav>
      </header>
      <main className="flex flex-col gap-8">{children}</main>
    </div>
  );
}
