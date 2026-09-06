import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Activity } from "lucide-react";

import { SectionCard, StatusChip, EmptyState } from "@/components/ui";
import { listActivity } from "@/services/activityService";
import { formatDateTime } from "@/lib/format";

export async function ActivityTimeline() {
  const events = await listActivity();

  if (events.length === 0) {
    return (
      <SectionCard>
        <EmptyState icon={<Activity size="inherit" />} title="No activity yet" />
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <Stack spacing={0}>
        {events.map((event, index) => (
          <Stack key={event.id} direction="row" spacing={2} sx={{ pb: index === events.length - 1 ? 0 : 3 }}>
            <Stack
              sx={{
                alignItems: "center",
                flexShrink: 0
              }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: `${event.severity === "error" ? "error" : event.severity === "warning" ? "warning" : event.severity === "success" ? "success" : "info"}.main`,
                  mt: 0.75,
                }}
                aria-hidden
              />
              {index !== events.length - 1 && (
                <Box sx={{ flex: 1, width: "1px", bgcolor: "divider", my: 0.5, minHeight: 24 }} />
              )}
            </Stack>
            <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                <Typography variant="body2" sx={{
                  fontWeight: 600
                }}>
                  {event.message}
                </Typography>
                <StatusChip status={event.severity} />
              </Stack>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {event.source} · {formatDateTime(event.timestamp)}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </SectionCard>
  );
}
