"use client";
/** «Esci»: Better Auth ends the session, then the sign-in page. */
import { useState } from "react";
import { authClient } from "./auth-client";

export function SignOut() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="k-btn secondary"
      aria-busy={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        window.location.assign("/sign-in");
      }}
    >
      Esci
    </button>
  );
}
