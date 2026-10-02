/**
 * app/(auth)/sign-up/page.tsx — URL /sign-up. Same shape as sign-in.
 * Whether sign-up is actually allowed is decided by the SERVER (ALLOW_SIGNUP,
 * and an invitation, ADR-0034; core/auth/auth.ts), not by hiding this page.
 */
import { redirect } from "next/navigation";
import { getSession } from "@/app/_server/owner";
import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { SignUpForm } from "@/features/account/auth/SignUpForm";
import { dictionaries } from "@/i18n";

type Props = { searchParams: Promise<{ invite?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  if (await getSession()) redirect("/");
  const t = dictionaries[DEFAULT_LOCALE];
  // ADR-0034: the invitation link carries the code (/sign-up?invite=…).
  const invite = (await searchParams).invite ?? "";
  return (
    <>
      <h1 className="section-heading">{t.auth.signUpTitle}</h1>
      <SignUpForm invite={invite} t={t.auth} />
    </>
  );
}
