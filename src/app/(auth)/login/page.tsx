import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in — My Agent Platform" };

export default function LoginPage() {
  return <LoginForm />;
}
