/**
 * app/(auth)/sign-in/page.tsx — URL /sign-in.
 *
 * A server component that decides, then delegates: if you're already signed
 * in it sends you home; otherwise it renders the SignInForm feature with the
 * dictionary. The login itself happens in the browser (SignInForm ->
 * auth-client -> /api/auth).
 */
import { redirect } from "next/navigation";
import { getSession } from "@/app/_server/owner";
import { DEFAULT_LOCALE } from "@/core/shared/locales";
import { SignInForm } from "@/features/account/auth/SignInForm";
import { dictionaries } from "@/i18n";

export default async function SignInPage() {
  if (await getSession()) redirect("/");
  const t = dictionaries[DEFAULT_LOCALE];
  return (
    <>
      <h1 className="font-display text-2xl font-bold">{t.auth.signInTitle}</h1>
      <SignInForm t={t.auth} />
    </>
  );
}
