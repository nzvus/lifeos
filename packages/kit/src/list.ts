/**
 * A list's window (P6, ledger UI-41, UI-100): the first rows shown, the rest
 * behind «Mostra altri (n)». Pure: what a list of `total` rows shows.
 */
export const LIST_WINDOW = 8;

export function listWindow(
  total: number,
  open: boolean,
  window = LIST_WINDOW,
): { shown: number; rest: number } {
  // One row behind the button is no saving: show it.
  if (total <= window + 1 || open) return { shown: total, rest: 0 };
  return { shown: window, rest: total - window };
}
