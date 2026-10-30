"use client";
/**
 * Levels of expansion (ledger UI-80, the developer 30 Oct: «più gradi di
 * espandibilità… che viene ricordata nelle aperture delle pagine»): a piece
 * that opens has numbered levels, 0 the smallest; one tap goes to the next,
 * after the last back to 0. The level reached is kept per piece in this
 * browser, so the page opens the way it was left. Storage can be missing or
 * blocked: then the level lives in memory until the page is closed.
 */
import { useCallback, useSyncExternalStore } from "react";

const PREFIX = "lifeos.level.";
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

export const nextLevel = (level: number, max: number) => (level >= max ? 0 : level + 1);

/** A stored value back to a level within 0…max; anything else is the fallback. */
export function readLevel(raw: string | null | undefined, max: number, fallback: number) {
  const n = raw == null || raw === "" ? NaN : Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : fallback;
}

function get(key: string): string | null {
  const m = memory.get(key);
  if (m !== undefined) return m;
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function set(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Private window or blocked storage: memory keeps it for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** [level, next]: the server draws the fallback, the browser the level kept. */
export function useLevel(key: string, max: number, fallback = 1) {
  const raw = useSyncExternalStore(
    subscribe,
    () => get(key),
    () => null,
  );
  const level = readLevel(raw, max, fallback);
  const next = useCallback(
    () => set(key, String(nextLevel(level, max))),
    [key, level, max],
  );
  return [level, next] as const;
}
