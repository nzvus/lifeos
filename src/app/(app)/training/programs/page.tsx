/**
 * app/(app)/training/programs/page.tsx — URL /training/programs: my programs
 * are listed under the Plan's calendar (ADR-0036). A program's own pages
 * (/training/programs/[id], /new) stay here.
 */
import { redirect } from "next/navigation";

export default function ProgramsPage() {
  redirect("/training/plan");
}
