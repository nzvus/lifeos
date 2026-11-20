/**
 * An open voce's details as tiles, lines and words (PAT-30): what a box that has no plan of its
 * own yet shows open. A meal's box draws its plan's slots instead (`MealBox`, §132 c).
 */

export type BoxDetails = {
  stats: { label: string; value: string }[];
  lines: { label: string; value: string }[];
  foot: string;
};

/** The open box's details: the numbers as tiles, then the lines, then where it comes from. */
export function EntryDetails({ d }: { d: BoxDetails }) {
  return (
    <div className="k-stack g2 k-details">
      {d.stats.length > 0 && (
        <div className="k-stats">
          {d.stats.map((s) => (
            <span key={s.label} className="k-stat">
              <span className="k-help">{s.label}</span>
              <span className="v">{s.value}</span>
            </span>
          ))}
        </div>
      )}
      {d.lines.map((l, k) => (
        <div key={k} className="k-line between">
          <span className="k-body">{l.label}</span>
          <span className="k-num k-right">{l.value}</span>
        </div>
      ))}
      {d.foot && <span className="k-help">{d.foot}</span>}
    </div>
  );
}
