import { notFound } from "next/navigation";
import { DashboardHeader, PageContainer } from "@/components/layout";
import { DeviceDetail } from "@/features/devices/DeviceDetail";
import { getDevice } from "@/services/deviceService";
import { listAgentTasks } from "@/services/agentTaskService";
import { listActivity } from "@/services/activityService";

export default async function DeviceDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const [device, tasks, activity] = await Promise.all([getDevice(deviceId), listAgentTasks(), listActivity()]);
  if (!device) notFound();

  return (
    <>
      <DashboardHeader
        title={device.name}
        description={`${device.type} · ${device.deviceId}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Devices", href: "/dashboard/devices" },
          { label: device.name },
        ]}
      />
      <PageContainer>
        <DeviceDetail initialDevice={device} tasks={tasks} activity={activity} />
      </PageContainer>
    </>
  );
}
