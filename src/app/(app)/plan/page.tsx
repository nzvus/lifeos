/**
 * app/(app)/plan/page.tsx — URL /plan: the Plan moved into Training
 * (ADR-0036). Old links and installed shortcuts land there, on the month
 * they asked for.
 */
import { redirect } from "next/navigation";
import { isMonth } from "@/core/training/calendar";

type Props = { searchParams: Promise<{ month?: string }> };

export default async function OldPlanPage({ searchParams }: Props) {
  const month = (await searchParams).month;
  redirect(
    month && isMonth(month)
      ? `/training/plan?view=month&day=${month}-01`
      : "/training/plan",
  );
}
