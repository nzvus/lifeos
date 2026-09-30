/**
 * features/account/auth/SignOutButton.tsx — ends the session.
 * signOut() asks the server to delete this session's row and clear the
 * cookie; then we go to the sign-in page.
 */
"use client";

import { useRouter } from "next/navigation";
import { authClient } from "./auth-client";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
      className="text-meta underline"
    >
      {label}
    </button>
  );
}
