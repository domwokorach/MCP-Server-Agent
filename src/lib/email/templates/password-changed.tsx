import { EmailLayout, emailText } from "./layout";

export interface PasswordChangedEmailProps {
  fullName: string;
  changedAt: Date;
}

export function PasswordChangedTemplate({ fullName, changedAt }: PasswordChangedEmailProps) {
  const formatted = changedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <EmailLayout preheader="Your password was changed">
      <p style={emailText.heading}>Your password was changed</p>
      <p style={emailText.body}>
        Hi {fullName}, this confirms your My Agent Platform password was changed on {formatted} UTC. All active
        sessions have been signed out and you&apos;ll need to sign in again.
      </p>
      <p style={emailText.muted}>
        If you didn&apos;t make this change, please reset your password immediately and contact support — your
        account may be compromised.
      </p>
    </EmailLayout>
  );
}
