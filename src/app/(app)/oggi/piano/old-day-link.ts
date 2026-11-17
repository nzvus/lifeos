/**
 * PAT-97: Piano holds no days since #362. An old link to a day there (`/oggi/piano?giorno=…`)
 * opens that day in Oggi; anything else stays on the Piano list.
 */
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function oldDayLink(giorno: string | string[] | undefined): string | null {
  return typeof giorno === "string" && ISO.test(giorno) ? "/oggi/" + giorno : null;
}
