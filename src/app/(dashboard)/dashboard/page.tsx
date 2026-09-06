import type { Metadata } from "next";
import { DashboardHeader, PageContainer } from "@/components/layout";
import { DashboardOverview } from "@/features/dashboard/DashboardOverview";

export const metadata: Metadata = { title: "Dashboard — My Agent Platform" };

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader title="Dashboard" description="An overview of your devices, agents, and activity." />
      <PageContainer>
        <DashboardOverview />
      </PageContainer>
    </>
  );
}
