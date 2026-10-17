"use client";
/**
 * Email and password, to sign in or to create the account (when the server
 * allows it). The cookie comes back with the response; then the app opens.
 * A failed sign-in says nothing about which part was wrong.
 */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "./auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    const { error } =
      mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: email.split("@")[0]! });
    setPending(false);
    if (error) {
      setError(
        mode === "sign-in"
          ? "Email o password non corretti."
          : "Non è stato possibile creare l’account.",
      );
      return;
    }
    router.push("/oggi");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="k-stack g3">
      {error && (
        <p className="k-banner bad" role="alert">
          {error}
        </p>
      )}
      <label className="k-field">
        <span className="lab">
          <span className="k-label">Email</span>
        </span>
        <input
          className="k-text"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="k-field">
        <span className="lab">
          <span className="k-label">Password</span>
        </span>
        <input
          className="k-text"
          name="password"
          type="password"
          minLength={10}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          required
        />
      </label>
      <button type="submit" className="k-btn primary" disabled={pending}>
        {mode === "sign-in" ? "Entra" : "Crea l’account"}
      </button>
    </form>
  );
}
