/**
 * features/account/auth/SignOutButton.tsx — ends the session.
 * signOut() asks the server to delete this session's row and clear the
 * cookie; then we go to the sign-in page.
 */
"use client";

import { useRouter } from "next/navigation";
import { authClient } from "./auth-client";
import { LogOut } from "lucide-react";
import { buttonClass } from "@/ui/button";

/** An icon (`compact`) or a labelled button (Settings → Account). */
export function SignOutButton({
  label,
  compact = true,
}: {
  label: string;
  compact?: boolean;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={
        compact
          ? buttonClass({ variant: "quiet", iconOnly: true })
          : `self-start ${buttonClass({ variant: "secondary" })}`
      }
    >
      <LogOut size={20} aria-hidden="true" />
      {!compact && label}
    </button>
  );
}
