import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  className?: string;
}

export function HeroBanner({ className }: HeroBannerProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        "min-h-[400px] sm:min-h-[460px] lg:min-h-[600px]",
        className
      )}
    >
      {/* Background artwork */}
      <div className="absolute inset-0">
        <Image
          src="/images/mcp-banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Readability overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/45"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-center gap-6 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-0">
        <div className="max-w-[560px] space-y-5 sm:max-w-[600px] sm:space-y-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary-foreground/70 uppercase sm:text-sm">
            My Agent Platform · MCP
          </p>
          <h1 className="text-[36px] leading-[1.08] font-extrabold tracking-tight text-white sm:text-[48px] lg:text-[64px]">
            AI agents.
            <br />
            Real action.
          </h1>
          <p className="max-w-[560px] text-base leading-relaxed text-slate-200 sm:text-lg lg:text-xl">
            Connect your agents to real tools, data, and services through the
            Model Context Protocol — deploy, monitor, and manage every
            connection from one platform.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <Button
              render={<Link href="/register" />}
              nativeButton={false}
              size="lg"
              className="h-12 w-full px-6 text-base sm:w-auto"
            >
              Get started
            </Button>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="h-12 w-full border-white/30 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Sign in
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
