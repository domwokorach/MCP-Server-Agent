import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={{ name: user.fullName, email: user.email }}>{children}</AppShell>;
}
