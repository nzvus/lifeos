import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/app/_server/owner";
import { env } from "@/app/_server/env";
import { AuthForm } from "@/features/account/AuthForm";

/**
 * Only while ALLOW_SIGNUP is "true"; otherwise the page does not exist.
 * Read per request (`connection`): prerendered, the build would need the
 * secrets, and a Preview has none.
 */
export default async function SignUpPage() {
  await connection();
  if (env().ALLOW_SIGNUP !== "true") notFound();
  if (await getSession()) redirect("/oggi");
  return (
    <>
      <h2 className="k-label">Crea l’account</h2>
      <AuthForm mode="sign-up" />
    </>
  );
}
