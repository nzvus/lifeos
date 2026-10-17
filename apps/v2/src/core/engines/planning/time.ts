/**
 * E3 Planning — time inside a logical day. A `DayMin` counts minutes from the
 * local midnight of the logical day's date, so it runs from the day boundary
 * to boundary + 1440: with a 04:00 boundary, 00:30 the night after is 1470.
 * "60 min after 23:30" is then plain arithmetic, with no wrap-around.
 * Converting to instants is the caller's, with the person's zone (E1).
 */
export type DayMin = number;

/** The minute of the clock (0…1439) of a `DayMin`, for display and E2's time-of-day filters. */
export const clockMin = (m: DayMin): number => ((m % 1440) + 1440) % 1440;
