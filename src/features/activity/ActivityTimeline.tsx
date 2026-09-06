import { Activity } from "lucide-react";
import { SectionCard, StatusChip, EmptyState } from "@/components/ui";
import { listActivity } from "@/services/activityService";
import { formatDateTime } from "@/lib/format";

export async function ActivityTimeline() {
  const events = await listActivity();

  if (events.length === 0) {
    return <SectionCard><EmptyState icon={<Activity />} title="No activity yet" /></SectionCard>;
  }

  return (
    <SectionCard>
      <div className="space-y-0">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex w-3 shrink-0 flex-col items-center">
              <span className={`mt-1.5 size-2.5 rounded-full ${event.severity === "error" ? "bg-destructive" : event.severity === "warning" ? "bg-warning" : event.severity === "success" ? "bg-success" : "bg-info"}`} />
              {index !== events.length - 1 && <span className="my-1 w-px flex-1 bg-border" />}
            </div>
            <div className={`min-w-0 flex-1 ${index !== events.length - 1 ? "pb-5" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">{event.message}</p>
                <StatusChip status={event.severity} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{event.source} · {formatDateTime(event.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
