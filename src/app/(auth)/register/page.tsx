import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account — My Agent Platform" };

export default function RegisterPage() {
  return <RegisterForm />;
}
