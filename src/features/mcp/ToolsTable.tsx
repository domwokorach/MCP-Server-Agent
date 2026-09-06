"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
    { key: "name", header: "Tool", render: (tool) => <span className="font-mono text-xs font-semibold">{tool.name}</span> },
    { key: "description", header: "Description", render: (tool) => <span className="text-muted-foreground">{tool.description}</span>, hideOnMobile: true },
    { key: "role", header: "Required role", render: (tool) => <Badge variant="outline">{tool.requiredRole}</Badge> },
    { key: "requests", header: "Requests", render: (tool) => tool.requestCount, align: "right" },
    { key: "errors", header: "Errors", render: (tool) => tool.errorCount, align: "right" },
    { key: "avg", header: "Avg. time", render: (tool) => `${tool.averageExecutionMs} ms`, align: "right" },
    { key: "enabled", header: "Enabled", align: "right", render: (tool) => <Switch checked={tool.enabled} disabled={pending === tool.name} onCheckedChange={() => void toggle(tool)} aria-label={`Toggle ${tool.name}`} /> },
  ];

  return (
    <>
      {message && <Alert className="mb-5" variant="destructive"><AlertDescription>{message}</AlertDescription></Alert>}
      <ResponsiveTable columns={columns} rows={tools} getRowKey={(tool) => tool.name} mobileTitle={(tool) => tool.name} />
    </>
  );
}
