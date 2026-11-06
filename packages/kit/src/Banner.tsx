"use client";
/**
 * Banner (PAT-72): saving failed. It says what happened, offers «Riprova», and the page keeps
 * what was typed (the banner never clears a form).
 */
import { WORDS } from "./words";

export function Banner({
  text,
  tone = "bad",
  onRetry,
}: {
  text: string;
  tone?: "warn" | "bad";
  onRetry?: () => void;
}) {
  return (
    <div className={"k-banner" + (tone === "bad" ? " bad" : "")} role="alert">
      <span>{text}</span>
      {onRetry && (
        <button type="button" className="k-btn link" onClick={onRetry}>
          {WORDS.retry}
        </button>
      )}
    </div>
  );
}
