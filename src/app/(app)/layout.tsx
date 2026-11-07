/**
 * The page shell of every signed-in page (PAT-01): the page, ⊕'s sheet when opened over it
 * (`@capture`), then the one NavBar and ⊕.
 * Pages never mount them; which addresses show them is `features/shell/nav.ts`.
 */
import { Suspense, type ReactNode } from "react";
import { AppNav } from "@/features/shell/AppNav";

export default function AppLayout({
  children,
  capture,
}: {
  children: ReactNode;
  /** ⊕ opened from a page: `/aggiungi` intercepted over it (`@capture`, PAT-60). */
  capture: ReactNode;
}) {
  return (
    <div className="k-shell">
      {children}
      {capture}
      <Suspense fallback={null}>
        <AppNav />
      </Suspense>
    </div>
  );
}
