/**
 * ui/MuscleChip.tsx — a muscle group as a small chip: a dot and the name in
 * its body region's colour (--color-muscle-*, design/theme.css). The main
 * group is bold. Keys are plain strings (ui/ may not import core types); an
 * unknown region gets the muted text colour.
 *
 * Used by the exercise list, the exercise editor (inside a toggle button)
 * and the training pages.
 */
export const REGION_TEXT: Record<string, string> = {
  chest: "text-muscle-chest",
  back: "text-muscle-back",
  shoulders: "text-muscle-shoulders",
  arms: "text-muscle-arms",
  core: "text-muscle-core",
  legs: "text-muscle-legs",
};

export const REGION_BG: Record<string, string> = {
  chest: "bg-muscle-chest",
  back: "bg-muscle-back",
  shoulders: "bg-muscle-shoulders",
  arms: "bg-muscle-arms",
  core: "bg-muscle-core",
  legs: "bg-muscle-legs",
};

export function MuscleChip({
  label,
  region,
  main = false,
}: {
  label: string;
  region: string;
  main?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-meta ${REGION_TEXT[region] ?? "text-muted"} ${main ? "font-semibold" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full ${REGION_BG[region] ?? "bg-hairline"}`}
      />
      {label}
    </span>
  );
}

/** Several chips in a wrapping row; the first is the main group. */
export function MuscleChips({
  groups,
}: {
  groups: readonly { label: string; region: string }[];
}) {
  if (groups.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-x-2.5 gap-y-0.5">
      {groups.map((g, i) => (
        <MuscleChip key={g.label} label={g.label} region={g.region} main={i === 0} />
      ))}
    </span>
  );
}
