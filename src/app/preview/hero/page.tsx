import type { Metadata } from "next";
import { HeroBanner } from "@/components/marketing/HeroBanner";

export const metadata: Metadata = { title: "Hero preview — My Agent Platform" };

export default function HeroPreviewPage() {
  return (
    <main className="min-h-dvh bg-background">
      <HeroBanner />
    </main>
  );
}
