/**
 * app/(app)/layout.tsx — frame for every SIGNED-IN page, adapted to the
 * screen:
 *   - phones: slim header (name + sign out) and a bottom tab bar (ui/NavBar)
 *     where the thumb reaches; extra bottom padding so content never hides
 *     behind the bar;
 *   - md and up: navigation in the header, no bottom bar.
 * Width: up to --container-wide (72rem); pages that are forms narrow
 * themselves to --container-page for readable line lengths.
 *
 * `requireContext()` runs here AND in each page and action. The layout's call
 * only protects what the layout renders; Next.js can render a page without
 * re-running its layout, so each page checks for itself. `cache()` in
 * _server/owner.ts makes the repeated calls free.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { requireContext } from "@/app/_server/owner";
import { SignOutButton } from "@/features/account/auth/SignOutButton";
import { NavBar } from "@/ui/NavBar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { t, settings } = await requireContext();
  const links = [
    { href: "/", label: t.nav.today, icon: "today" },
    { href: "/meals", label: t.nav.meals, icon: "meals" },
    { href: "/ingredients", label: t.nav.ingredients, icon: "ingredients" },
    { href: "/profiles", label: t.nav.profiles, icon: "targets" },
    { href: "/settings", label: t.nav.settings, icon: "settings" },
  ] as const;
  return (
    <div
      lang={settings.locale}
      className="mx-auto flex max-w-wide flex-col gap-6 px-4 pb-24 md:pb-16"
    >
      <header className="flex items-baseline justify-between gap-x-6 gap-y-2 rule-b-heavy border-ink pt-4 pb-2">
        <Link href="/" className="font-display text-title font-extrabold">
          {t.app.name}
        </Link>
        <NavBar links={[...links]} label={t.nav.menu} />
        <SignOutButton label={t.nav.signOut} />
      </header>
      <main className="flex flex-col gap-8">{children}</main>
    </div>
  );
}
