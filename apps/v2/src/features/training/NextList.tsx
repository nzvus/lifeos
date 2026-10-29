"use client";
/**
 * Gym mode's «Poi» (session.md §5.2, §6.4): the other exercises with their
 * plan, the whole row to go there; «⋯» on one not begun opens its actions:
 * «Fai dopo» (it becomes the next one: a machine free now, another taken),
 * «Cambia» (another of the person's exercises in its place), «In superserie
 * con» the exercise in progress (no muscle in common) or «Togli la
 * superserie», and «Salta»
 * («Rimetti» on a skipped one, which stays listed, faded); each undoable.
 * Then «Aggiungi esercizio», a search over the person's exercises, which
 * picks the replacement while «Cambia» is on. Split from Gym.tsx.
 */
import { useState } from "react";
import { Box } from "@lifeos/kit";
import type { GymExercise } from "./Gym";
import { planText } from "./gym-parts";
import { antagonists, canPair } from "./superset";

export function NextList({
  others,
  current,
  live,
  query,
  found,
  swapping,
  onQuery,
  onGo,
  onSkip,
  onNext,
  onSwap,
  onPair,
  onAdd,
}: {
  others: { e: GymExercise; i: number }[];
  /** The exercise in progress: the one a superset is made with. */
  current: GymExercise | null;
  /** The session is in progress (a finished one is read, not changed). */
  live: boolean;
  query: string;
  found: { id: string; name: string }[];
  /** «Cambia» is on for this exercise: the search picks its replacement. */
  swapping: GymExercise | null;
  onQuery: (q: string) => void;
  onGo: (i: number) => void;
  onSkip: (e: GymExercise, skip: boolean) => void;
  onNext: (e: GymExercise) => void;
  onSwap: (e: GymExercise | null) => void;
  onPair: (e: GymExercise, with_: GymExercise | null) => void;
  onAdd: (exerciseId: string) => void;
}) {
  const [menu, setMenu] = useState<string | null>(null);
  const all = [...others.map((o) => o.e), ...(current ? [current] : [])];
  const partnerOf = (e: GymExercise) => all.find((y) => y.entryId === e.partner);
  return (
    <section className="k-section g2" aria-label="Poi">
      <h2>Poi</h2>
      {others.map(({ e, i }) => {
        const open = menu === e.entryId;
        const can = live && e.done.length === 0;
        return (
          <div key={e.entryId} className="k-stack g1">
            <Box
              density="row"
              rail={false}
              onToggle={() => onGo(i)}
              acts={
                can
                  ? [
                      {
                        label: "⋯",
                        aria: e.name + ": fai dopo, cambia, salta",
                        onClick: () => setMenu(open ? null : e.entryId),
                      },
                    ]
                  : []
              }
              entry={{
                fam: "train",
                of: e.of,
                title: e.name,
                meta: e.skipped
                  ? "saltato oggi"
                  : [
                      partnerOf(e) && "in superserie con " + partnerOf(e)!.name,
                      planText(e),
                    ]
                      .filter(Boolean)
                      .join(" · "),
                faded: e.skipped,
              }}
            />
            {can && open && (
              <div className="k-line wrap g2" aria-label={"Azioni su " + e.name}>
                {!e.skipped && (
                  <button
                    type="button"
                    className="k-btn secondary"
                    onClick={() => {
                      setMenu(null);
                      onNext(e);
                    }}
                  >
                    Fai dopo
                  </button>
                )}
                {!e.skipped && (
                  <button
                    type="button"
                    className="k-btn secondary"
                    onClick={() => {
                      setMenu(null);
                      onSwap(e);
                    }}
                  >
                    Cambia
                  </button>
                )}
                {!e.skipped &&
                  current &&
                  e.partner !== current.entryId &&
                  canPair(e, current) && (
                    <button
                      type="button"
                      className="k-btn secondary"
                      onClick={() => {
                        setMenu(null);
                        onPair(e, current);
                      }}
                    >
                      In superserie con {current.name}
                      {antagonists(e, current) ? " (antagonisti)" : ""}
                    </button>
                  )}
                {e.partner && (
                  <button
                    type="button"
                    className="k-btn secondary"
                    onClick={() => {
                      setMenu(null);
                      onPair(e, null);
                    }}
                  >
                    Togli la superserie
                  </button>
                )}
                <button
                  type="button"
                  className="k-btn secondary"
                  onClick={() => {
                    setMenu(null);
                    onSkip(e, !e.skipped);
                  }}
                >
                  {e.skipped ? "Rimetti" : "Salta"}
                </button>
              </div>
            )}
          </div>
        );
      })}
      {live && (
        <div className="k-line g2">
          <input
            className="k-text k-grow"
            type="search"
            placeholder={
              swapping ? "Cambia «" + swapping.name + "» con…" : "Aggiungi esercizio"
            }
            aria-label={
              swapping ? "Cambia " + swapping.name + " con" : "Aggiungi esercizio"
            }
            value={query}
            onChange={(ev) => onQuery(ev.target.value)}
          />
          {swapping && (
            <button type="button" className="k-btn link" onClick={() => onSwap(null)}>
              Lascia
            </button>
          )}
        </div>
      )}
      {found.map((c) => (
        <button key={c.id} type="button" className="k-pick" onClick={() => onAdd(c.id)}>
          <Box
            density="row"
            rail={false}
            entry={{ fam: "train", title: c.name, value: swapping ? "↔" : "+" }}
          />
        </button>
      ))}
    </section>
  );
}
