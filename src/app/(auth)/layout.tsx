import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div aria-hidden className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--primary),transparent_70%)] opacity-10" />
      <div className="relative w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <span className="size-2 rounded-sm bg-current" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            Agent Platform
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}
