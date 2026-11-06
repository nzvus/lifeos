"use client";
/**
 * Why (PAT-51): tapping a number opens its «Perché?», generated from the metric declaration
 * (`why.ts`, MOD-40). No page writes an explanation by hand.
 */
import { useState, type ReactNode } from "react";
import { Sheet } from "./Sheet";
import { whySections, type WhyDeclaration } from "./why";
import { WORDS } from "./words";

export function Why({
  children,
  decl,
  initiallyOpen = false,
}: {
  children: ReactNode;
  decl: WhyDeclaration;
  /** Open from the start (the gallery's photos). */
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <button
        type="button"
        className="k-why"
        aria-label={`${decl.title}: ${WORDS.why}`}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <Sheet
        open={open}
        title={decl.title}
        meta={WORDS.why}
        onClose={() => setOpen(false)}
      >
        {whySections(decl).map((s) => (
          <section key={s.title} className="k-stack g1" aria-label={s.title}>
            <h3 className="k-label">{s.title}</h3>
            {s.rows.map((r, i) => (
              <div key={i} className="k-whyrow">
                <span className="k-body">{r.label}</span>
                {r.value && <span className="k-num">{r.value}</span>}
                {r.note && <span className="k-meta">{r.note}</span>}
              </div>
            ))}
          </section>
        ))}
      </Sheet>
    </>
  );
}
