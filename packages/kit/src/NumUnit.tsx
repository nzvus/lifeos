/**
 * A number with its unit a size smaller, on one line (his §161: «kcal… più piccolo in
 * proporzione»; §187): «1.633 kcal» → 1.633 + a smaller «kcal». The head's value and a misura's.
 */
export function NumUnit({ v, className }: { v: string; className: string }) {
  const m = /^(.*\d)\s+([^\d\s][^\d]*)$/u.exec(v);
  return (
    <span className={"k-num k-nowrap " + className}>
      {m ? (
        <>
          {m[1]}
          <span className="k-unit">{"\u00a0" + m[2]}</span>
        </>
      ) : (
        v
      )}
    </span>
  );
}
