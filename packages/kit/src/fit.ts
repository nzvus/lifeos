/**
 * A one-line row's scale (VIS-108, his 21 Nov §152): what it needs against the room it has, never
 * below the floor; past the floor it wraps instead. Pure.
 */
export const FIT_FLOOR = 0.8;

export function fitScale(
  room: number,
  needed: number,
  floor = FIT_FLOOR,
): { scale: number; wrap: boolean } {
  if (!(room > 0) || !(needed > room)) return { scale: 1, wrap: false };
  const s = room / needed;
  return s >= floor ? { scale: s, wrap: false } : { scale: floor, wrap: true };
}
