"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/ui";

interface ToolRow {
  name: string;
  description: string;
  enabled: boolean;
  requiredRole: "user" | "developer" | "admin";
  requestCount: number;
  errorCount: number;
  averageExecutionMs: number;
}

export function ToolsTable() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState<string>();

  const load = async () => {
    const response = await fetch("/api/mcp/tools");
    if (!response.ok) {
      setMessage("You do not have permission to view the tool registry.");
      return;
    }
    const data = (await response.json()) as { tools: ToolRow[] };
    setTools(data.tools);
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const toggle = async (tool: ToolRow) => {
    setPending(tool.name);
    setMessage(undefined);
    try {
      const response = await fetch(`/api/mcp/tools/${encodeURIComponent(tool.name)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-mcp-csrf": "1" },
        body: JSON.stringify({ enabled: !tool.enabled }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Unable to update tool.");
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update tool.");
    } finally {
      setPending(undefined);
    }
  };

  const columns: ResponsiveTableColumn<ToolRow>[] = [
    { key: "name", header: "Tool", render: (t) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography> },
    { key: "description", header: "Description", render: (t) => t.description, hideOnMobile: true },
    { key: "role", header: "Required role", render: (t) => <Chip size="small" label={t.requiredRole} variant="outlined" /> },
    { key: "requests", header: "Requests", render: (t) => t.requestCount, align: "right" },
    { key: "errors", header: "Errors", render: (t) => t.errorCount, align: "right" },
    { key: "avg", header: "Avg. time", render: (t) => `${t.averageExecutionMs} ms`, align: "right" },
    {
      key: "enabled",
      header: "Enabled",
      align: "right",
      render: (t) => (
        <Switch
          checked={t.enabled}
          disabled={pending === t.name}
          onChange={() => void toggle(t)}
          slotProps={{ input: { "aria-label": `Toggle ${t.name}` } }}
        />
      ),
    },
  ];

  return (
    <>
      {message && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setMessage(undefined)}>
          {message}
        </Alert>
      )}
      <ResponsiveTable columns={columns} rows={tools} getRowKey={(t) => t.name} mobileTitle={(t) => t.name} />
    </>
  );
}
