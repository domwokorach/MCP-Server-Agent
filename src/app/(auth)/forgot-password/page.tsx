import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password — My Agent Platform" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
