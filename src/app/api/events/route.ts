import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { subscribeRealtimeEvents, type RealtimeEvent } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function encodeEvent(event: RealtimeEvent) {
  return encoder.encode(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ message: "Cross-origin event streams are not allowed." }, { status: 403 });
  }
  if (rateLimit("realtime:connect", clientIp(request), 30, 60_000).limited) {
    return Response.json({ message: "Too many realtime connections." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  const stream = new ReadableStream({
    start(controller) {
      const close = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
        controller.close();
      };
      unsubscribe = subscribeRealtimeEvents((event) => controller.enqueue(encodeEvent(event)));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "system.health", timestamp: new Date().toISOString(), data: { status: "healthy" } })}\n\n`));
      heartbeat = setInterval(() => controller.enqueue(encoder.encode(": heartbeat\n\n")), 15_000);
      request.signal.addEventListener("abort", close, { once: true });
    },
    cancel() {
      closed = true;
      unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}
