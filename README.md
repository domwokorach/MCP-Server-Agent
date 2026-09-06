# My Agent Platform

The dashboard and MCP service for **My Agent Platform**.

## MCP server

The server exposes nine Zod-validated tools over STDIO and Streamable HTTP:

```bash
npm run mcp
```

Use the Inspector during local development:

```bash
npm run mcp:inspect
```

Remote clients use `POST /api/mcp`. VS Code can load the STDIO server from `.vscode/mcp.json`.

## Dashboard and management API

Run the dashboard with:

```bash
npm run dev
```

Open `/dashboard/mcp` for live status, read-only redacted logs, and the approved start, stop, and restart controls. The dashboard receives status changes using server-sent events.

Open `/dashboard/terminal` for an interactive, admin-only terminal backed by the MCP `terminal_execute` tool. Every command is authenticated (session, admin role), CSRF-checked, classified into a SAFE / REQUIRES_CONFIRMATION / ADMIN_ONLY / DENIED tier (`src/lib/terminal/command-policy.ts`), and then run through the same MCP security gateway pipeline used by STDIO/HTTP MCP clients (`POST /api/terminal/execute`). The tool itself stays disabled until an administrator sets `MCP_TERMINAL_ENABLED=true`.

Set `MCP_MANAGEMENT_TOKEN` in every production environment. Management API callers must provide it as a Bearer token. State-changing requests must also send `x-mcp-csrf: 1` and a same-origin `Origin`:

```bash
curl -X POST http://localhost:3000/api/mcp/restart \
  -H "Authorization: Bearer $MCP_MANAGEMENT_TOKEN" \
  -H "x-mcp-csrf: 1"
```

On localhost, controls use a local-only development bootstrap; production requests without a configured token are rejected. The process manager starts only the repository's fixed `tsx apps/mcp/src/index.ts` command and redacts secrets from emitted logs.
# MCP-Server-Agent
