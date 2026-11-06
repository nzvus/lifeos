/**
 * The page shell of every signed-in page (PAT-01): the page, then the one NavBar and ⊕.
 * Pages never mount them; which addresses show them is `features/shell/nav.ts`.
 */
import { Suspense, type ReactNode } from "react";
import { AppNav } from "@/features/shell/AppNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="k-shell">
      {children}
      <Suspense fallback={null}>
        <AppNav />
      </Suspense>
    </div>
  );
}
