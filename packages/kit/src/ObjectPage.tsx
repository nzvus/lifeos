/**
 * ObjectPage (PAT-30): the same page for every catalog type — header (PAT-02), the values that
 * matter as editable rows, its parts, «Andamento» (MOD-50), «Usato in», and the actions row at
 * the end. A type fills the slots; it never draws a page of its own (PRD-18).
 */
import type { ReactNode } from "react";
import type { GlyphOf } from "./glyph";
import { PageHeader } from "./PageHeader";
import { WORDS } from "./words";

export function ObjectPage({
  back,
  title,
  meta,
  of,
  values,
  parts,
  progress,
  usedIn,
  actions,
  toast,
}: {
  back: { label: string; href: string };
  title: string;
  /** One line under the title. */
  meta?: string;
  of?: GlyphOf;
  /** The values that matter, as editable rows (PAT-13). */
  values: ReactNode;
  /** Its parts, each a titled section (a food's brands, what is at home). */
  parts?: readonly { title: string; node: ReactNode }[];
  progress?: ReactNode;
  usedIn?: ReactNode;
  /** `ObjectActions`. */
  actions: ReactNode;
  /** `useToast()`'s toast: inside the page, last, as the shell's rules expect (PAT-74). */
  toast?: ReactNode;
}) {
  return (
    <main className="k-page k-objpage">
      <PageHeader
        back={back}
        title={title}
        {...(meta ? { context: meta } : {})}
        {...(of ? { of } : {})}
      />
      <section className="k-section g2" aria-label={title}>
        {values}
      </section>
      {parts?.map((p) => (
        <section key={p.title} className="k-section g2" aria-label={p.title}>
          <h2>{p.title}</h2>
          {p.node}
        </section>
      ))}
      {progress && (
        <section className="k-section g2" aria-label={WORDS.sections.progress}>
          <h2>{WORDS.sections.progress}</h2>
          {progress}
        </section>
      )}
      {usedIn && (
        <section className="k-section g2" aria-label={WORDS.sections.usedIn}>
          <h2>{WORDS.sections.usedIn}</h2>
          {usedIn}
        </section>
      )}
      {actions}
      {toast}
    </main>
  );
}
