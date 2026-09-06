import { SectionCard, StatusChip } from "@/components/ui";
import { listMcpServers } from "@/services/mcpService";
import { formatRelativeTime } from "@/lib/format";

export async function McpStatusSettings() {
  const servers = await listMcpServers();

  return (
    <SectionCard title="MCP servers" subtitle="Model Context Protocol servers available to your agents.">
      <div className="divide-y divide-border">
        {servers.map((server) => (
          <div key={server.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{server.name}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{server.endpoint} · {server.toolCount} tools · pinged {formatRelativeTime(server.lastPing)}</p>
            </div>
            <StatusChip status={server.connected ? "online" : "offline"} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
