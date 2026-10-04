/**
 * app/(app)/layout.tsx — frame for every SIGNED-IN page, adapted to the
 * screen:
 *   - phones: slim header (name, settings) and a bottom tab bar (ui/NavBar)
 *     where the thumb reaches; extra bottom padding so content never hides
 *     behind the bar or under the "+" (2026-10-04: it covered the last row);
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
import { AddMenu } from "@/ui/AddMenu";
import { NavBar, NavIconLink } from "@/ui/NavBar";
import { ToastHost } from "@/ui/Toast";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { t, settings } = await requireContext();
  // ADR-0038: four areas around the day, Today in the middle. Progress is
  // shared: nutrition trends belong to Food, weight and training to Body.
  const links = [
    {
      href: "/training/plan",
      label: t.nav.body,
      icon: "body",
      match: ["/training", "/profiles?view=weight", "/profiles?view=training"],
    },
    {
      href: "/meals",
      label: t.nav.food,
      icon: "meals",
      match: ["/ingredients", "/pantry", "/profiles?view=trends"],
    },
    { href: "/", label: t.nav.today, icon: "today", center: true },
    { href: "/money", label: t.nav.money, icon: "money" },
    { href: "/mind", label: t.nav.mind, icon: "mind" },
  ] as const;
  return (
    <div
      lang={settings.locale}
      className="mx-auto flex max-w-wide flex-col gap-4 px-4 pb-40 md:pb-16"
    >
      <header className="flex items-center justify-between gap-x-6 gap-y-2 app-header-rule pt-2 pb-1">
        <Link href="/" className="font-heading text-section font-extrabold">
          {t.app.name}
        </Link>
        <NavBar links={[...links]} label={t.nav.menu} />
        {/* ADR-0035: the Assistant from every page, next to Settings. Sign out
            lives at the bottom of Settings (S3): rare, and easy to tap by mistake. */}
        <div className="flex items-center gap-1">
          <NavIconLink href="/assistant" label={t.assistant.title} icon="assistant" />
          <NavIconLink href="/settings" label={t.nav.settings} icon="settings" />
        </div>
      </header>
      <main className="@container flex flex-col gap-4">{children}</main>
      {/* The "+" of each section (the day page has its own). */}
      <AddMenu
        labels={{ open: t.addMenu.open, title: t.addMenu.title, close: t.actions.close }}
        sections={[
          {
            prefix: "/training",
            items: [
              { href: "/training/new", label: t.addMenu.session, icon: "session" },
              {
                href: "/training/routines/new",
                label: t.addMenu.routine,
                icon: "routine",
              },
              {
                href: "/training/exercises/new",
                label: t.addMenu.exercise,
                icon: "exercise",
              },
              {
                href: "/training/programs/new",
                label: t.addMenu.program,
                icon: "program",
              },
            ],
          },
          {
            // ADR-0036: the movement sheet lives on the Money pages.
            prefix: "/money",
            items: [{ href: "#money-add", label: t.money.add, icon: "movement" }],
          },
          {
            prefix: "/pantry",
            items: [
              {
                href: "/pantry/products/new?from=/pantry",
                label: t.addMenu.product,
                icon: "product",
              },
              { href: "/pantry#new-batch", label: t.addMenu.batch, icon: "batch" },
              {
                href: "/pantry#new-reminder",
                label: t.addMenu.reminder,
                icon: "reminder",
              },
            ],
          },
          ...["/meals", "/ingredients"].map((prefix) => ({
            prefix,
            items: [
              { href: "/meals/new", label: t.addMenu.meal, icon: "meal" as const },
              {
                // The quick sheet on the ingredients page (opens on arrival).
                href: "/ingredients#new-ingredient",
                label: t.addMenu.ingredient,
                icon: "ingredient" as const,
              },
              {
                href: "/pantry/products/new?from=/pantry",
                label: t.addMenu.product,
                icon: "product" as const,
              },
            ],
          })),
          {
            prefix: "/profiles",
            items: [
              { href: "/#day-weigh", label: t.addMenu.weight, icon: "weight" },
              { href: "/profiles/new", label: t.addMenu.dayType, icon: "dayType" },
            ],
          },
        ]}
      />
      <ToastHost closeLabel={t.actions.close} />
    </div>
  );
}
