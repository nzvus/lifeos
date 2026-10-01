/**
 * ui/FormAlert.tsx — a message about the whole form: an error that belongs to
 * no single field ("It doesn't exist anymore"), a confirmation ("Saved."),
 * or information with its own buttons ("You have unsaved changes… Restore").
 *
 * role="alert" makes screen readers announce errors immediately;
 * role="status" announces the others politely.
 */
import type { ReactNode } from "react";

type Props = { tone: "error" | "success" | "info"; children: ReactNode };

const TONE = {
  error: "border-tomato font-semibold text-tomato",
  success: "border-herb font-semibold text-herb",
  info: "border-warn",
} as const;

export function FormAlert({ tone, children }: Props) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rule-l-heavy pl-3 ${TONE[tone]}`}
    >
      {children}
    </div>
  );
}
