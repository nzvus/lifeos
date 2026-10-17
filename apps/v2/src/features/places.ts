/** Where the four places live (ADR-0054). Plain data: server pages pass it to the kit. */
export const PLACES = {
  today: "/oggi",
  plan: "/piano",
  progress: "/andamento",
  library: "/libreria",
} as const;
