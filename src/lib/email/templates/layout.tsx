// Shared table-based layout for transactional emails. Inline styles only —
// email clients strip <style> blocks and ignore most CSS, including oklch.

const BRAND = {
  bg: "#f3f4f8",
  card: "#ffffff",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  primary: "#4338ca",
  primaryInk: "#ffffff",
};

interface EmailLayoutProps {
  preheader: string;
  children: React.ReactNode;
}

export function EmailLayout({ preheader, children }: EmailLayoutProps) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: BRAND.bg, fontFamily: "Helvetica, Arial, sans-serif" }}>
        <span style={{ display: "none", overflow: "hidden", lineHeight: "1px", opacity: 0, maxHeight: 0, maxWidth: 0 }}>
          {preheader}
        </span>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: BRAND.bg, padding: "32px 16px" }}>
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: 480, margin: "0 auto" }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingBottom: 24 }}>
                        <table role="presentation" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 10,
                                  backgroundColor: BRAND.primary,
                                  color: BRAND.primaryInk,
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                  fontWeight: 700,
                                  fontSize: 14,
                                }}
                              >
                                A
                              </td>
                              <td style={{ paddingLeft: 10, fontSize: 15, fontWeight: 700, color: BRAND.ink }}>
                                My Agent Platform
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          backgroundColor: BRAND.card,
                          border: `1px solid ${BRAND.border}`,
                          borderRadius: 16,
                          padding: 32,
                        }}
                      >
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "20px 8px 0", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 12, color: BRAND.muted, lineHeight: 1.6 }}>
                          My Agent Platform · AI agents, real action.
                          <br />
                          If you didn&apos;t expect this email, you can safely ignore it.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export const emailText = {
  heading: { margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: BRAND.ink },
  body: { margin: "0 0 16px", fontSize: 14, lineHeight: 1.6, color: "#334155" },
  muted: { margin: "0 0 16px", fontSize: 13, lineHeight: 1.6, color: BRAND.muted },
} as const;

export const brand = BRAND;
