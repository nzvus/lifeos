/**
 * ui/FormAlert.tsx — a message about the whole form: an error that belongs to
 * no single field ("It doesn't exist anymore"), or a confirmation ("Saved.").
 *
 * role="alert" makes screen readers announce errors immediately;
 * role="status" announces confirmations politely.
 */
type Props = { tone: "error" | "success"; children: string };

export function FormAlert({ tone, children }: Props) {
  return tone === "error" ? (
    <p role="alert" className="rule-l-heavy border-tomato pl-3 font-semibold text-tomato">
      {children}
    </p>
  ) : (
    <p role="status" className="rule-l-heavy border-herb pl-3 font-semibold text-herb">
      {children}
    </p>
  );
}
