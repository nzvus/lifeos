"use client";
/**
 * ObjectPage (PAT-30) in the gallery: one exercise with example values, the same page every
 * catalog type will get in phase 4. Client, because its actions answer with a toast.
 */
import { EmptyState, F, ObjectActions, ObjectPage, Unknown, useToast } from "@lifeos/kit";

export function ObjectDemo() {
  const { say, toast } = useToast();
  return (
    <ObjectPage
      back={{ label: "Corpo", href: "/kit" }}
      title="Panca piana"
      meta="Petto · 31 sessioni · ultima ieri"
      of={{ fam: "train", kind: "session" }}
      values={
        <div className="k-stack g1">
          <span className="k-label">Recupero</span>
          <span className="k-num d3">{F.clock(150)}</span>
          <span className="k-label">Guida</span>
          <span className="k-body">
            Scapole addotte, piedi a terra, bilanciere al petto basso.
          </span>
        </div>
      }
      parts={{
        title: "Varianti",
        node: (
          <EmptyState
            glyph={{ fam: "train", kind: "session" }}
            title="Nessuna variante"
            body="Una variante tiene solo le differenze: presa stretta, manubri."
          />
        ),
      }}
      progress={<Unknown missing={["2 sessioni con lo stesso carico"]} />}
      usedIn={<span className="k-body">Push A · Push B</span>}
      actions={
        <ObjectActions
          title="Panca piana"
          verbs={["startFrom", "variant", "archive", "merge", "delete"]}
          onVerb={(v) => say("Fatto: " + v, () => undefined)}
        />
      }
      toast={toast}
    />
  );
}
