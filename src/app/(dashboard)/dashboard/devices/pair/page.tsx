import type { Metadata } from "next";
import { DashboardHeader, PageContainer } from "@/components/layout";
import { PairDeviceFlow } from "@/features/pairing/PairDeviceFlow";

export const metadata: Metadata = { title: "Pair a device — My Agent Platform" };

export default function PairingPage() {
  return (
    <>
      <DashboardHeader
        title="Pair a device"
        description="Approve a mobile, desktop, or laptop connection in a few secure steps."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Devices", href: "/dashboard/devices" },
          { label: "Pair" },
        ]}
      />
      <PageContainer>
        <PairDeviceFlow />
      </PageContainer>
    </>
  );
}
