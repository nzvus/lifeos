/**
 * features/account/auth/SignInForm.tsx — email + password sign-in.
 *
 * A client component ("use client") because it calls the auth client from
 * the browser and shows the result without a page reload. On success, the
 * session cookie is set by the server response; we then navigate to "/" and
 * `router.refresh()` so server components re-render as the signed-in user.
 *
 * Rendered by src/app/(auth)/sign-in/page.tsx, which passes `t`.
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

export function SignInForm({ t }: { t: Messages["auth"] }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // we send the request ourselves, not via page reload
    const form = new FormData(event.currentTarget);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) {
      // Deliberately vague: saying "wrong password" would confirm the email exists.
      setFailed(true);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {failed && <FormAlert tone="error">{t.failed}</FormAlert>}
      <Field label={t.email} name="email" type="email" autoComplete="email" required />
      <Field
        label={t.password}
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className={buttonClass({ variant: "primary", block: true })}
      >
        {t.signIn}
      </button>
      <Link href="/sign-up" className={`self-start text-meta ${TEXT_LINK}`}>
        {t.toSignUp}
      </Link>
    </form>
  );
}
