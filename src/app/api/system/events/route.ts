import type { NextRequest } from "next/server";
import { requireManagementAccess } from "@/lib/api-security";
import { mcpRuntime } from "@/services/mcpRuntimeService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  const denied = await requireManagementAccess(request);
  if (denied) return denied;

  let unsubscribe = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const publish = () => controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify(mcpRuntime.getStatus())}\n\n`));
      publish();
      unsubscribe = mcpRuntime.subscribe(publish);
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
    cancel() {
      unsubscribe();
    },
  });
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}
