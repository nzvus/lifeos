"use client";
/**
 * Gym mode's «Poi» actions that change the session (session.md §5.2):
 * «Salta», «Fai dopo» (an exercise becomes the next one, the rest keep their
 * order) and «Cambia» (another exercise in its place), each told in a toast
 * with «Annulla» for 5 s. Split from Gym.tsx.
 */
import { useRef, useState } from "react";
import type { GymActions, GymExercise } from "./Gym";

const NOTICE_MS = 5000;

export function usePoi(p: {
  sessionId: string;
  exercises: readonly GymExercise[];
  at: number;
  setAt: (i: number) => void;
  actions: Pick<GymActions, "reorder" | "swap" | "skip">;
  catalog: readonly { id: string; name: string }[];
  /** Other toasts give way to this one. */
  quiet: () => void;
}) {
  const [notice, setNotice] = useState<{
    text: string;
    undo: () => Promise<unknown>;
  } | null>(null);
  const [swapping, setSwapping] = useState<GymExercise | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tell = (text: string, undo: () => Promise<unknown>) => {
    clearTimeout(timer.current);
    p.quiet();
    setNotice({ text, undo });
    timer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  };

  const skip = async (e: GymExercise, on: boolean) => {
    if (!(await p.actions.skip(e.entryId, on))) return;
    if (on) tell("Saltato · " + e.name, () => p.actions.skip(e.entryId, false));
    else setNotice(null);
  };

  const next = async (e: GymExercise) => {
    const before = p.exercises.map((y) => y.entryId);
    const cur = p.exercises[p.at]?.entryId;
    const rest = before.filter((id) => id !== e.entryId);
    const after = [...rest];
    after.splice(cur ? rest.indexOf(cur) + 1 : 0, 0, e.entryId);
    if (!(await p.actions.reorder(p.sessionId, after))) return;
    if (cur) p.setAt(after.indexOf(cur));
    tell(e.name + " · il prossimo", async () => {
      await p.actions.reorder(p.sessionId, before);
      if (cur) p.setAt(before.indexOf(cur));
    });
  };

  /** While «Cambia» is on, a picked exercise replaces it: true when it did. */
  const swapTo = async (exerciseId: string): Promise<boolean> => {
    if (!swapping) return false;
    const e = swapping;
    setSwapping(null);
    const was = await p.actions.swap(e.entryId, exerciseId);
    if (was) {
      const name = p.catalog.find((c) => c.id === exerciseId)?.name ?? "";
      tell(e.name + " → " + name, () => p.actions.swap(e.entryId, was));
    }
    return true;
  };

  const undo = async () => {
    const n = notice;
    setNotice(null);
    if (n) await n.undo();
  };

  return { notice, swapping, setSwapping, skip, next, swapTo, undo };
}
