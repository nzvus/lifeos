/**
 * Toast (PAT-74, PAT-21): one at a time above the NavBar, 5 s, its only action «Annulla».
 * Pure state: each toast has its own number, so the timer of an old toast never closes a new
 * one (the copies of 6 Nov shared one timer ref), and «Annulla» runs at most once.
 */
export const TOAST_MS = 5000;

export type ToastData = { n: number; text: string; undoable: boolean };
export type ToastState = { current: ToastData | null };
export type ToastEvent =
  | { type: "show"; n: number; text: string; undoable: boolean }
  | { type: "expire"; n: number }
  | { type: "undo"; n: number };

export const TOAST_START: ToastState = { current: null };

export function toastReducer(s: ToastState, e: ToastEvent): ToastState {
  if (e.type === "show")
    return { current: { n: e.n, text: e.text, undoable: e.undoable } };
  // A stale timer or a second tap on «Annulla» changes nothing.
  if (s.current?.n !== e.n) return s;
  return { current: null };
}
