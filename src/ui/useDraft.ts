/**
 * ui/useDraft.ts — unsaved changes survive leaving the page (ADR-0015):
 * while a form differs from what is saved, its state is kept in this
 * browser under `key`; coming back, the form offers to restore it. No
 * "are you sure you want to leave?" dialogs. Storage may be missing
 * (private mode): then there is simply no draft.
 *
 *   const draft = useDraft("meal:123", state, dirty);
 *   draft.found   -> a draft from an earlier visit, to offer
 *   draft.clear() -> after saving, or when the user discards it
 */
"use client";

import { useEffect, useRef, useState } from "react";

const prefix = "lifeos.draft.";

export function useDraft<T>(key: string, state: T, dirty: boolean) {
  const [found, setFound] = useState<T | null>(null);
  // Nothing is written before the old draft is read: the fresh, unchanged
  // form would otherwise erase it on its first render.
  const read = useRef(false);

  // After mount (the server render cannot read this browser's storage).
  useEffect(() => {
    const h = setTimeout(() => {
      try {
        const raw = localStorage.getItem(prefix + key);
        if (raw) setFound(JSON.parse(raw) as T);
      } catch {}
      read.current = true;
    }, 0);
    return () => clearTimeout(h);
  }, [key]);

  // Keep the draft in step with the form; nothing changed, nothing kept.
  useEffect(() => {
    if (!read.current || found !== null) return; // not read yet, or waiting for a decision
    try {
      if (dirty) localStorage.setItem(prefix + key, JSON.stringify(state));
      else localStorage.removeItem(prefix + key);
    } catch {}
  }, [key, state, dirty, found]);

  const clear = () => {
    try {
      localStorage.removeItem(prefix + key);
    } catch {}
    setFound(null);
  };
  return { found, clear };
}
