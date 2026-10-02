/**
 * app/(app)/training/page.tsx — URL /training: the Training tab opens on its
 * library's routines (ADR-0035). What was here moved: the history and the
 * stats to Progress → Training, starting a session to Today (the "+").
 * Old links with ?week= land on the week they asked for.
 */
import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ week?: string }> };

export default async function TrainingPage({ searchParams }: Props) {
  const week = (await searchParams).week;
  redirect(week ? `/profiles?view=training&week=${week}` : "/training/routines");
}
