/**
 * ContextLine (PAT-33, MOD-53): what surrounded a voce — the relations in their declared windows
 * («5 h 30 di sonno · caffè 40 min fa») — as one line beside it, never inside its number. The
 * caller says each part in words (through `F`); an empty context draws nothing.
 */
import { WORDS } from "./words";

export function ContextLine({ parts }: { parts: readonly string[] }) {
  const shown = parts.filter((p) => p.trim());
  if (shown.length === 0) return null;
  return (
    <p className="k-meta k-context" aria-label={WORDS.context + ": " + shown.join(", ")}>
      {shown.join(" · ")}
    </p>
  );
}
