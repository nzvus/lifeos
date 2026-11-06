"use client";
/**
 * Toast (PAT-74, PAT-21): one at a time above the NavBar, 5 s, its only action «Annulla».
 * `useToast()` gives a page `say(text, undo?)` and the `toast` element to render once.
 */
import { useCallback, useEffect, useReducer, useRef } from "react";
import { TOAST_MS, TOAST_START, toastReducer, type ToastData } from "./toast";
import { WORDS } from "./words";

export function Toast({
  toast,
  onUndo,
  onExpire,
}: {
  toast: ToastData | null;
  onUndo: (n: number) => void;
  onExpire: (n: number) => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onExpire(toast.n), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast, onExpire]);
  if (!toast) return null;
  return (
    <div className="k-toastbar">
      <div className="k-toast" role="status">
        <span>{toast.text}</span>
        {toast.undoable && (
          <button type="button" className="k-btn link" onClick={() => onUndo(toast.n)}>
            {WORDS.undo}
          </button>
        )}
      </div>
    </div>
  );
}

/** A page's toast: `say` shows one (replacing the last); its undo runs at most once. */
export function useToast() {
  const [state, dispatch] = useReducer(toastReducer, TOAST_START);
  const undos = useRef(new Map<number, () => unknown>());
  const seq = useRef(1);
  const say = useCallback((text: string, undo?: () => unknown) => {
    const n = seq.current++;
    if (undo) undos.current.set(n, undo);
    dispatch({ type: "show", n, text, undoable: !!undo });
  }, []);
  const onExpire = useCallback((n: number) => {
    undos.current.delete(n);
    dispatch({ type: "expire", n });
  }, []);
  const onUndo = useCallback((n: number) => {
    const run = undos.current.get(n);
    undos.current.delete(n);
    dispatch({ type: "undo", n });
    void run?.();
  }, []);
  const toast = <Toast toast={state.current} onUndo={onUndo} onExpire={onExpire} />;
  return { say, toast };
}
