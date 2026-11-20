/**
 * A thing's members as a small row that scrolls sideways (his 20 Nov, proposal §129–§130; VIS-40):
 * a cibo's marche instead of «1 prodotto». With `onPick` it is a choice — one chip is on, a tap
 * puts another on and the box redraws with it; without, the chips only name. No written label
 * (his «non mi piace "marche" scritto così… niente, meglio pure»): it is the row's aria-label.
 * Never wraps; the edge with more fades, as the doors' row does. The kit knows no type (PAT-81).
 */
export type ChipItem = { key: string; label: string; value?: string };

export function ChipRow({
  label,
  items,
  selected,
  onPick,
}: {
  label: string;
  items: ChipItem[];
  selected?: string;
  onPick?: (key: string) => void;
}) {
  if (items.length === 0) return null;
  const inner = (i: ChipItem) => (
    <>
      <span>{i.label}</span>
      {i.value && <span className="k-meta">{i.value}</span>}
    </>
  );
  return (
    <div className="k-hrow" role={onPick ? "group" : "list"} aria-label={label}>
      {items.map((i) =>
        onPick ? (
          <button
            key={i.key}
            type="button"
            className="k-chip k-hchip"
            aria-pressed={i.key === selected}
            onClick={() => onPick(i.key)}
          >
            {inner(i)}
          </button>
        ) : (
          <span key={i.key} role="listitem" className="k-chip static k-hchip">
            {inner(i)}
          </span>
        ),
      )}
    </div>
  );
}
