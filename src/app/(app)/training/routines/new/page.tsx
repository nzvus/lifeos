/** app/(app)/training/routines/new/page.tsx — URL /training/routines/new[?from=PATH]. */
import { requireContext } from "@/app/_server/owner";
import { safeFrom } from "@/core/shared/navigation";
import { RoutineEditor } from "@/features/training/routines/RoutineEditor";
import { PageHeader } from "@/ui/PageHeader";
import { createRoutineAction } from "../../actions";
import { routineExercises } from "../routine-page-data";

type Props = { searchParams: Promise<{ from?: string }> };

export default async function NewRoutinePage({ searchParams }: Props) {
  const { owner, t } = await requireContext();
  const from = safeFrom((await searchParams).from, "/training/routines");
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={t.routines.new}
        back={{
          href: from,
          label: from === "/training/routines" ? t.routines.back : t.actions.back,
        }}
      />
      <RoutineEditor
        from={from}
        action={createRoutineAction}
        exercises={await routineExercises(owner)}
        initial={{ name: "", notes: "", items: [] }}
        t={{
          routines: t.routines,
          training: t.training,
          errors: t.errors,
          search: t.search,
          actions: t.actions,
        }}
      />
    </div>
  );
}
