/**
 * `/{area}/{type}/nuovo` (PAT-11): a type's create form, looked up by type key in this one map
 * (PAT-90). A type with plain declared fields will get the generated `ObjectForm` here; a type
 * with a specialisation brings its own editor (PAT-61).
 */
import { PageHeader } from "@lifeos/kit";
import { TrackerForm } from "@/features/account/TrackerForm";
import { tracker } from "@/i18n/tracker";
import { createTracker } from "./tracker-actions";

type NewForm = (back: { label: string; href: string }) => React.ReactNode;

const trackerNew: NewForm = (back) => (
  <main className="k-page">
    <PageHeader title={tracker.page.newTitle} back={back} of={{ fam: "habit" }} />
    <section className="k-section g3" aria-label={tracker.page.newTitle}>
      <TrackerForm action={createTracker} />
    </section>
  </main>
);

export const NEW_FORMS: Record<string, NewForm> = { tracker: trackerNew };
