import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { DashboardHeader, PageContainer } from "@/components/layout";
import { DevicesList } from "@/features/devices/DevicesList";

export const metadata: Metadata = { title: "Connected Devices — My Agent Platform" };

export default function DevicesPage() {
  return (
    <>
      <DashboardHeader
        title="Connected Devices"
        description="Manage your mobile and desktop agent connections"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Devices" }]}
        primaryAction={{
          label: "Add Device",
          icon: <Plus size={18} />,
          href: "/dashboard/devices/pair",
        }}
      />
      <PageContainer>
        <DevicesList />
      </PageContainer>
    </>
  );
}
