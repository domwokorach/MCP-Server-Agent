import { EmailLayout, emailText, brand } from "./layout";

export interface ResetPasswordEmailProps {
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function ResetPasswordTemplate({ fullName, resetUrl, expiresInMinutes }: ResetPasswordEmailProps) {
  return (
    <EmailLayout preheader="Reset your My Agent Platform password">
      <p style={emailText.heading}>Reset your password</p>
      <p style={emailText.body}>
        Hi {fullName}, we received a request to reset your password. This link expires in {expiresInMinutes}{" "}
        minutes and can only be used once.
      </p>
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "0 0 20px" }}>
        <tbody>
          <tr>
            <td style={{ borderRadius: 10, backgroundColor: brand.primary }}>
              <a
                href={resetUrl}
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: brand.primaryInk,
                  textDecoration: "none",
                }}
              >
                Reset password
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <p style={emailText.muted}>
        If the button doesn&apos;t work, copy and paste this link into your browser:
        <br />
        <a href={resetUrl} style={{ color: brand.primary }}>
          {resetUrl}
        </a>
      </p>
      <p style={emailText.muted}>
        Didn&apos;t request a password reset? You can ignore this email — your password won&apos;t be changed.
      </p>
    </EmailLayout>
  );
}
