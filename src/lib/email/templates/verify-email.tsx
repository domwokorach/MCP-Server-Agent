import { EmailLayout, emailText, brand } from "./layout";

export interface VerifyEmailProps {
  fullName: string;
  pin: string;
  expiresInMinutes: number;
}

export function VerifyEmailTemplate({ fullName, pin, expiresInMinutes }: VerifyEmailProps) {
  const digits = pin.split("");

  return (
    <EmailLayout preheader={`Your verification code is ${pin}`}>
      <p style={emailText.heading}>Verify your email</p>
      <p style={emailText.body}>
        Hi {fullName}, use the code below to verify your My Agent Platform account. This code expires in{" "}
        {expiresInMinutes} minutes and can only be used once.
      </p>
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "0 0 20px" }}>
        <tbody>
          <tr>
            {digits.map((digit, index) => (
              <td key={index} style={{ paddingRight: index < digits.length - 1 ? 8 : 0 }}>
                <div
                  style={{
                    width: 40,
                    height: 48,
                    borderRadius: 10,
                    border: `1px solid ${brand.border}`,
                    backgroundColor: brand.bg,
                    color: brand.ink,
                    fontSize: 22,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "48px",
                    fontFamily: "monospace",
                  }}
                >
                  {digit}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p style={emailText.muted}>
        Didn&apos;t create this account? You can ignore this email — no account will be activated without this
        code.
      </p>
    </EmailLayout>
  );
}
