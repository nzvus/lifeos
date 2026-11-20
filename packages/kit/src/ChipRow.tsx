/**
 * A thing's members as a small row that scrolls sideways (his 20 Nov, proposal §129; VIS-40): a
 * cibo's marche instead of «1 prodotto», and any list of parts an open box names. Its label opens
 * the row, then one chip per item — name and, when known, a short value. Never wraps; the edge with
 * more fades, as the doors' row does. The kit knows no type: the caller gives the words (PAT-81).
 */
export type ChipItem = { key: string; label: string; value?: string };

export function ChipRow({ label, items }: { label: string; items: ChipItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="k-hrow" role="list" aria-label={label}>
      <span className="k-cap k-hrow-label" aria-hidden="true">
        {label}
      </span>
      {items.map((i) => (
        <span key={i.key} role="listitem" className="k-chip static k-hchip">
          <span>{i.label}</span>
          {i.value && <span className="k-meta">{i.value}</span>}
        </span>
      ))}
    </div>
  );
}
