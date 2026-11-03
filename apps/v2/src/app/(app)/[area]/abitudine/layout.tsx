/** Map D (architecture.md §10): this object lives in Mente; another area has no such page. */
import { notFound } from "next/navigation";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ area: string }>;
}) {
  if ((await params).area !== "mente") notFound();
  return children;
}
