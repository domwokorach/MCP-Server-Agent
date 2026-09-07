import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/VerifyEmailForm";

export const metadata: Metadata = { title: "Verify your email — My Agent Platform" };

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
