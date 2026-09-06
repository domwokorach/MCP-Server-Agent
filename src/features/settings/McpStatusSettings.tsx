import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SectionCard, StatusChip } from "@/components/ui";
import { listMcpServers } from "@/services/mcpService";
import { formatRelativeTime } from "@/lib/format";

export async function McpStatusSettings() {
  const servers = await listMcpServers();

  return (
    <SectionCard title="MCP servers" subtitle="Model Context Protocol servers available to your agents.">
      <Stack spacing={2} divider={<Stack sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
        {servers.map((server) => (
          <Stack
            key={server.id}
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              pt: 1
            }}>
            <Stack spacing={0.25}>
              <Typography variant="body2" sx={{
                fontWeight: 600
              }}>
                {server.name}
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {server.endpoint} · {server.toolCount} tools · pinged {formatRelativeTime(server.lastPing)}
              </Typography>
            </Stack>
            <StatusChip status={server.connected ? "online" : "offline"} />
          </Stack>
        ))}
      </Stack>
    </SectionCard>
  );
}
