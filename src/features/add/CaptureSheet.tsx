"use client";
/**
 * ⊕ (PAT-60; Q-12 «a», 7 Nov): the kit's `Capture` over the kinds he can enter, his foods,
 * saved meals and schede; at rest the page's ranked rows (children, from the server). A row
 * opens its door; «Chiudi» goes back. Drawn in place (`SheetInline`), so the page is the sheet
 * from the first paint.
 */
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Capture, SheetInline } from "@lifeos/kit";
import { add } from "@/i18n/add";
import { findTargets, type AddTarget } from "./search";

export function CaptureSheet({
  targets,
  hour,
  meta,
  back,
  children,
}: {
  targets: AddTarget[];
  hour: number;
  meta: string;
  back: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <SheetInline.Provider value>
      <Capture
        open
        area={null}
        meta={meta}
        types={[]}
        objects={findTargets(targets)}
        hour={hour}
        label={add.search.label(targets.length)}
        onPick={(t) => router.push(t.href)}
        onClose={() => router.push(back)}
      >
        {children}
      </Capture>
    </SheetInline.Provider>
  );
}
