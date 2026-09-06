import type { NextRequest } from "next/server";
import { handleMcpHttpRequest } from "@/lib/mcp-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleMcpHttpRequest(request);
}
