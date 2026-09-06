import type { Metadata } from "next";
import { DashboardHeader, PageContainer } from "@/components/layout";
import { ProfileSettings } from "@/features/settings/ProfileSettings";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { McpStatusSettings } from "@/features/settings/McpStatusSettings";

export const metadata: Metadata = { title: "Settings — My Agent Platform" };

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Manage your profile, appearance, and integrations."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
      />
      <PageContainer>
        <div className="space-y-5">
          <ProfileSettings />
          <AppearanceSettings />
          <McpStatusSettings />
        </div>
      </PageContainer>
    </>
  );
}
