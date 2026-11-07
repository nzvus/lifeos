"use client";
/**
 * ⊕'s one search (PAT-41, PAT-60; change 2026-11-07-food-meal): the kit's `Find` over the
 * kinds he can enter, his foods, saved meals and routines; while something is typed its rows
 * replace the sheet's sections, which come from the server as children. A row opens its door.
 */
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Find } from "@lifeos/kit";
import { add } from "@/i18n/add";
import { findTargets, type AddTarget } from "./search";

export function AddSearch({
  targets,
  hour,
  children,
}: {
  targets: AddTarget[];
  hour: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [typed, setTyped] = useState(false);
  const items = findTargets(targets);
  return (
    <>
      <section className="k-section" aria-label={add.search.section}>
        <Find
          items={items}
          idle={[]}
          label={add.search.label(targets.length)}
          hour={hour}
          onQuery={(q) => setTyped(q.trim() !== "")}
          onPick={(t) => router.push(t.href)}
        />
      </section>
      {!typed && children}
    </>
  );
}
