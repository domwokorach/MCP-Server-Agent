import "server-only";
import { Resend } from "resend";
import { VerifyEmailTemplate } from "./templates/verify-email";
import { ResetPasswordTemplate } from "./templates/reset-password";
import { PasswordChangedTemplate } from "./templates/password-changed";

// Lazily constructed so a missing RESEND_API_KEY doesn't crash the build —
// it only throws when an email is actually sent.
let client: Resend | null = null;

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  if (!client) client = new Resend(apiKey);
  return client;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "My Agent Platform <no-reply@yourdomain.com>";
}

export async function sendVerificationPin(input: {
  to: string;
  fullName: string;
  pin: string;
  expiresInMinutes: number;
}): Promise<void> {
  const { error } = await getClient().emails.send({
    from: fromAddress(),
    to: input.to,
    subject: "Verify your My Agent Platform account",
    react: VerifyEmailTemplate({ fullName: input.fullName, pin: input.pin, expiresInMinutes: input.expiresInMinutes }),
  });
  if (error) {
    console.error("[email] failed to send verification pin", error.message);
    throw new Error("Unable to send verification email.");
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  const { error } = await getClient().emails.send({
    from: fromAddress(),
    to: input.to,
    subject: "Reset your My Agent Platform password",
    react: ResetPasswordTemplate({
      fullName: input.fullName,
      resetUrl: input.resetUrl,
      expiresInMinutes: input.expiresInMinutes,
    }),
  });
  if (error) {
    console.error("[email] failed to send password reset email", error.message);
    throw new Error("Unable to send password reset email.");
  }
}

export async function sendPasswordChangedEmail(input: { to: string; fullName: string; changedAt: Date }): Promise<void> {
  const { error } = await getClient().emails.send({
    from: fromAddress(),
    to: input.to,
    subject: "Your My Agent Platform password was changed",
    react: PasswordChangedTemplate({ fullName: input.fullName, changedAt: input.changedAt }),
  });
  if (error) {
    // Never let a notification-email failure surface to the caller — the
    // password change itself already succeeded.
    console.error("[email] failed to send password-changed notification", error.message);
  }
}
