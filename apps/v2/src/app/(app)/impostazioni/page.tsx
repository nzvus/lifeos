/**
 * Impostazioni (V-14), first part: the account (who is signed in, «Esci»)
 * and the profile and day settings. Data (export, trash) and the theme come
 * with their slices.
 */
import { F, PageHeader } from "@lifeos/kit";
import { getSession, requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readSettings } from "@/core/account/settings";
import { SettingsForm } from "@/features/account/SettingsForm";
import { SignOut } from "@/features/account/SignOut";
import { saveSettingsForm } from "./actions";

export default async function SettingsPage() {
  const owner = await requireOwner();
  const session = await getSession();
  const s = await readSettings(await getDb(), owner);
  return (
    <main className="k-page">
      <PageHeader
        title="Impostazioni"
        back={{ label: "Oggi", href: "/oggi" }}
        of={{ place: "impostazioni" }}
      />
      <section className="k-section g3" aria-label="Account">
        <h2>Account</h2>
        <div className="k-line between">
          <span className="k-body">{session?.user.email}</span>
          <SignOut />
        </div>
      </section>
      <section className="k-section g3" aria-label="Tu e la giornata">
        <h2>Tu e la giornata</h2>
        <SettingsForm
          action={saveSettingsForm}
          initial={{
            sex: s.sex ?? "",
            birthYear: s.birthYear === null ? "" : String(s.birthYear),
            heightCm: s.heightCm === null ? "" : F.n(Number(s.heightCm), 1),
            timeZone: s.timeZone,
            boundary: F.time(s.boundaryMin),
          }}
        />
      </section>
      <section className="k-section g2" aria-label="Dati">
        <h2>Dati</h2>
        <p className="k-help">
          Esportazione, cestino e tema arrivano con le prossime parti.
        </p>
      </section>
    </main>
  );
}
