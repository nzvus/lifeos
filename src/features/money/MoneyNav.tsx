/**
 * features/money/MoneyNav.tsx — the Money tab's views (ADR-0036): the
 * month at a glance | every movement. Links, one URL per view.
 */
import { ChartPie, List } from "lucide-react";
import type { Messages } from "@/i18n";
import { SubNav } from "@/ui/SubNav";

export function MoneyNav({
  current,
  month,
  t,
}: {
  current: "overview" | "movements";
  month: string;
  t: Messages["money"];
}) {
  return (
    <SubNav
      label={t.title}
      current={current}
      items={[
        {
          key: "overview",
          href: `/money?month=${month}`,
          label: t.overview,
          icon: <ChartPie size={16} aria-hidden="true" />,
        },
        {
          key: "movements",
          href: `/money/movements?month=${month}`,
          label: t.movements,
          icon: <List size={16} aria-hidden="true" />,
        },
      ]}
    />
  );
}
