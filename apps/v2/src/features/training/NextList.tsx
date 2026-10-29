"use client";
/**
 * Gym mode's «Poi» (session.md §6.4): the other exercises with their plan,
 * the whole row to go there; «Salta» on one not begun (undoable: «Rimetti»
 * on a skipped one, which stays listed, faded); then «Aggiungi esercizio»,
 * a search over the person's exercises. Split from Gym.tsx.
 */
import { Box } from "@lifeos/kit";
import type { GymExercise } from "./Gym";
import { planText } from "./gym-parts";

export function NextList({
  others,
  live,
  query,
  found,
  onQuery,
  onGo,
  onSkip,
  onAdd,
}: {
  others: { e: GymExercise; i: number }[];
  /** The session is in progress (a finished one is read, not changed). */
  live: boolean;
  query: string;
  found: { id: string; name: string }[];
  onQuery: (q: string) => void;
  onGo: (i: number) => void;
  onSkip: (e: GymExercise, skip: boolean) => void;
  onAdd: (exerciseId: string) => void;
}) {
  return (
    <section className="k-section g2" aria-label="Poi">
      <h2>Poi</h2>
      {others.map(({ e, i }) => (
        <Box
          key={e.entryId}
          density="row"
          rail={false}
          onToggle={() => onGo(i)}
          acts={
            !live || e.done.length > 0
              ? []
              : [
                  e.skipped
                    ? {
                        label: "Rimetti",
                        aria: e.name + ": rimetti tra quelli da fare",
                        onClick: () => onSkip(e, false),
                      }
                    : {
                        label: "Salta",
                        aria: e.name + ": salta oggi",
                        onClick: () => onSkip(e, true),
                      },
                ]
          }
          entry={{
            fam: "train",
            of: e.of,
            title: e.name,
            meta: e.skipped ? "saltato oggi" : planText(e),
            faded: e.skipped,
          }}
        />
      ))}
      {live && (
        <input
          className="k-text"
          type="search"
          placeholder="Aggiungi esercizio"
          aria-label="Aggiungi esercizio"
          value={query}
          onChange={(ev) => onQuery(ev.target.value)}
        />
      )}
      {found.map((c) => (
        <button key={c.id} type="button" className="k-pick" onClick={() => onAdd(c.id)}>
          <Box
            density="row"
            rail={false}
            entry={{ fam: "train", title: c.name, value: "+" }}
          />
        </button>
      ))}
    </section>
  );
}
