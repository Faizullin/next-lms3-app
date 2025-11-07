"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Settings from "./_components/settings";
import { SettingsProvider } from "./_components/settings-context";

export default function Page() {
  const { t } = useTranslation(["common"]);
  const searchParams = useSearchParams();
  const breadcrumbs = [{ label: t("common:settings"), href: "/dashboard/admin/settings" }];
  const tab = searchParams?.get("tab") || "General";

  return (
    <DashboardContent breadcrumbs={breadcrumbs}>
      <SettingsProvider>
        <Settings selectedTab={tab} />
      </SettingsProvider>
    </DashboardContent>
  );
}
