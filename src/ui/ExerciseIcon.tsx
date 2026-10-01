/**
 * ui/ExerciseIcon.tsx — an exercise's movement pattern as a stick figure
 * (ui/exerciseIconShapes.ts), in its body region's colour (ui/MuscleChip
 * REGION_TEXT) or the surrounding text colour. Keys are plain strings (ui/
 * may not import core types); an unknown or missing pattern draws "other".
 */
import { EXERCISE_ICON_SHAPES } from "./exerciseIconShapes";
import { REGION_TEXT } from "./MuscleChip";

export function ExerciseIcon({
  pattern,
  region,
  size = 20,
}: {
  pattern: string | null;
  region?: string | null;
  size?: number;
}) {
  const shapes =
    (pattern && EXERCISE_ICON_SHAPES[pattern]) || EXERCISE_ICON_SHAPES.other!;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${(region && REGION_TEXT[region]) || ""}`}
    >
      {shapes.map((s, i) =>
        typeof s === "string" ? (
          <path key={i} d={s} />
        ) : (
          <circle key={i} cx={s[0]} cy={s[1]} r={s[2] ?? 2} />
        ),
      )}
    </svg>
  );
}
