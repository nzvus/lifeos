/**
 * Unknown (PAT-55): «non so» where a judgement would be, when coverage is below its threshold
 * (MOD-41, PRD-23), with what is missing.
 */
import { unknownWords } from "./why";

export function Unknown({ missing }: { missing: readonly string[] }) {
  const w = unknownWords(missing);
  return (
    <span className="k-unknown">
      <span className="w">{w.word}</span>
      {w.missing && <span className="k-meta">{w.missing}</span>}
    </span>
  );
}
