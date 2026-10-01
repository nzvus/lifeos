/**
 * app/(auth)/sign-up/page.tsx — URL /sign-up. Same shape as sign-in.
 * Whether sign-up is actually allowed is decided by the SERVER (ALLOW_SIGNUP,
 * core/auth/auth.ts), not by hiding this page.
 */
import { redirect } from "next/navigation";
import { getSession } from "@/app/_server/owner";
import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { SignUpForm } from "@/features/account/auth/SignUpForm";
import { dictionaries } from "@/i18n";

export default async function SignUpPage() {
  if (await getSession()) redirect("/");
  const t = dictionaries[DEFAULT_LOCALE];
  return (
    <>
      <h1 className="section-heading">{t.auth.signUpTitle}</h1>
      <SignUpForm t={t.auth} />
    </>
  );
}
