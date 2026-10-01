/**
 * ui/exerciseIconShapes.ts — the drawings of ui/ExerciseIcon: one stick
 * figure per movement pattern (core/training/anatomy.ts keys), on lucide's
 * grid so they sit next to its icons: 24×24, stroke 2, round caps and joins,
 * no fill. A string is a path; [x, y] is a head (circle, r = 2); [x, y, r]
 * is a circle of radius r (wheels).
 *
 * Kept as data, apart from the component, so a preview sheet can draw them
 * all at once (they were checked that way at 16, 20 and 32 px).
 */
export type Shape =
  string | readonly [number, number] | readonly [number, number, number];

export const EXERCISE_ICON_SHAPES: Record<string, readonly Shape[]> = {
  // Lying on a bench, arms pushing the bar up.
  horizontal_press: [
    "M4 18h14",
    "M6 18v3M16 18v3",
    "M7 15h8",
    [18, 14.5],
    "M7 15l-2-3",
    "M13 15V8",
    "M9 7h8",
  ],
  // Arms straight up, bar overhead.
  vertical_press: [
    [12, 9],
    "M12 11v6",
    "M8 3v6l4 2 4-2V3",
    "M5 3h14",
    "M12 17l-3 4M12 17l3 4",
  ],
  // Arms hugging forward (pec deck).
  fly: [
    [12, 5],
    "M12 7v8",
    "M7 13a5 4 0 0 1 10 0",
    "M5 9l2 4M19 9l-2 4",
    "M12 15l-3 6M12 15l3 6",
  ],
  // Seated, pulling a cable handle to the body.
  horizontal_pull: [
    [16, 5],
    "M16 7l1 8",
    "M17 15h-6v5",
    "M16 10l-4 2",
    "M3 12h9",
    "M12 10v4",
  ],
  // Seated, pulling a wide bar down.
  vertical_pull: [
    [12, 8],
    "M3 4h18",
    "M12 2v2",
    "M6 4l3 7h6l3-7",
    "M12 10v6",
    "M12 16H8v4M12 16h4v4",
  ],
  // Arms opening out to the sides.
  rear_fly: [
    [12, 5],
    "M12 7v8",
    "M5 10h14",
    "M6 8l-2 2 2 2M18 8l2 2-2 2",
    "M12 15l-3 6M12 15l3 6",
  ],
  // Dumbbells raised to the sides.
  lateral_raise: [
    [12, 5],
    "M12 7v8",
    "M12 9L5 7M12 9l7-2",
    "M4 5l1 4M20 5l-1 4",
    "M12 15l-3 6M12 15l3 6",
  ],
  // Elbow still, forearm curling a dumbbell up.
  curl: [[9, 4], "M9 6v8", "M9 14l-2 7M9 14l2 7", "M9 7v5l5-4", "M13 6l2 4"],
  // Cable from above, forearm pushing down (pushdown).
  triceps_extension: [
    [8, 4],
    "M8 6v8",
    "M8 14l-2 7M8 14l2 7",
    "M8 7v4l5 3",
    "M18 2l-5 12",
    "M16 2h4",
  ],
  // Hips back, knees forward, bar on the shoulders.
  squat: [[16, 4], "M15 7l-5 5", "M10 12l6 2-2 6h3", "M11 7h9"],
  // Reclined, feet pushing the sled away.
  leg_press: [[4, 8], "M5 10l3 8", "M8 18l3-7 6 3", "M16 9l3 9", "M3 21h9"],
  // Split stance, back knee low.
  lunge: [[12, 3.5], "M12 6v7", "M12 13h5v7", "M12 13l-4 6H4", "M12 8l-3 3M12 8l3 3"],
  // Bent at the hips, arms hanging, bar at the shins.
  hinge: [[19.5, 6], "M17 8l-8 2", "M9 10l1 11", "M15 8.5v8", "M11 17h8"],
  // Seated, heel curling back under the seat.
  leg_curl: [[6, 4], "M6 6v8", "M3 15h11", "M6 14h8", "M14 14l-3 6", "M10 20h3"],
  // Seated, shin kicking forward.
  leg_extension: [[6, 4], "M6 6v8", "M3 15h11", "M6 14h8", "M14 14l6-4", "M19 8v4"],
  // Up on the toes, on a step.
  calf_raise: [
    [10, 4],
    "M10 6v8",
    "M10 14v4l2 2",
    "M10 8l-3 3M10 8l3 3",
    "M8 21h8",
    "M19 10V3M17 5l2-2 2 2",
  ],
  // Lying, shoulders curling up.
  crunch: [[6, 12], "M3 20h18", "M8 14c1 3 2 5 5 5", "M13 19l3-5 3 5"],
  // Hanging from a bar, legs up at a right angle.
  leg_raise: [[9, 7], "M7 3h10", "M12 3v6", "M11 9v7", "M11 16h7", "M18 16v2"],
  // Forearms down, body straight.
  plank: [[4, 13], "M2 20h20", "M6 14l14 4", "M7 15v5h3", "M20 18v2"],
  // Running stride.
  run: [
    [15, 4],
    "M14 7l-3 6",
    "M13 9l-4 1M13 9l3 3 3-1",
    "M11 13l3 3-1 5",
    "M11 13l-3 3-4-1",
  ],
  // On a bike.
  bike: [[14, 4], "M13 6l-3 6h5l2 5", "M13 7l4 2", [5.5, 17.5, 3.5], [18.5, 17.5, 3.5]],
  // A dumbbell: anything else.
  other: ["M6 8v8M18 8v8", "M3 10v4M21 10v4", "M6 12h12"],
};
