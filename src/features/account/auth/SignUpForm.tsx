/**
 * features/account/auth/SignUpForm.tsx — create an account.
 *
 * Works only while ALLOW_SIGNUP=true on the server (ADR-0006 tripwire: the
 * URL is public, so sign-up is closed by default). With sign-up closed, the
 * server refuses and we show `signUpFailed`.
 * Password length is enforced by the server (core/auth/auth.ts
 * minPasswordLength); `minLength` here only gives earlier feedback.
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { authClient } from "./auth-client";
import { buttonClass, TEXT_LINK } from "@/ui/button";

export function SignUpForm({ t }: { t: Messages["auth"] }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) {
      setFailed(true);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {failed && <FormAlert tone="error">{t.signUpFailed}</FormAlert>}
      <Field label={t.name} name="name" autoComplete="name" required />
      <Field label={t.email} name="email" type="email" autoComplete="email" required />
      <Field
        label={t.password}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={10}
        hint={t.passwordHint}
        required
      />
      <button
        type="submit"
        disabled={pending}
        className={buttonClass({ variant: "primary", block: true })}
      >
        {t.signUp}
      </button>
      <Link href="/sign-in" className={`self-start text-meta ${TEXT_LINK}`}>
        {t.toSignIn}
      </Link>
    </form>
  );
}
