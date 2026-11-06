"use client";
/**
 * ⊕'s one search (the board Capture): the field on top; while something
 * is typed, the targets that match (features/add/search) replace the
 * sheet's sections, which come from the server as children.
 */
import { useState, type ReactNode } from "react";
import { Box } from "@lifeos/kit";
import { searchTargets, type AddTarget } from "./search";

export function AddSearch({
  targets,
  children,
}: {
  targets: AddTarget[];
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const found = searchTargets(targets, query);
  return (
    <>
      <section className="k-section" aria-label="Cerca">
        <input
          className="k-text"
          type="search"
          placeholder={"cerca tra " + targets.length + " cose"}
          aria-label="Cerca cosa aggiungere"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </section>
      {query.trim() === "" ? (
        children
      ) : (
        <section className="k-section" aria-label="Risultati">
          {found.length === 0 ? (
            <p className="k-help">Niente con queste parole.</p>
          ) : (
            <div className="k-stack g2">
              {found.map((t) => (
                <a key={t.key} href={t.href} className="k-plain">
                  <Box
                    density="row"
                    rail={false}
                    entry={{
                      fam: t.fam,
                      ...(t.of ? { of: t.of } : {}),
                      title: t.title,
                      meta: t.sub,
                      value: "›",
                    }}
                  />
                </a>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
