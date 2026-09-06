import type { ActivityEvent } from "@/types";
import { mockActivity } from "@/lib/mock-data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listActivity(): Promise<ActivityEvent[]> {
  await delay(300);
  return mockActivity;
}
