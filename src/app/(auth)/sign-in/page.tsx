import { redirect } from "next/navigation";
import { getSession } from "@/app/_server/owner";
import { env } from "@/app/_server/env";
import { AuthForm } from "@/features/account/AuthForm";

export default async function SignInPage() {
  if (await getSession()) redirect("/oggi");
  return (
    <>
      <h2 className="k-label">Entra</h2>
      <AuthForm mode="sign-in" />
      {env().ALLOW_SIGNUP === "true" && (
        <a className="k-link" href="/sign-up">
          Crea un account
        </a>
      )}
    </>
  );
}
