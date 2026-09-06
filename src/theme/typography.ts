import type { TypographyVariantsOptions } from "@mui/material/styles";

const fontFamily =
  'var(--font-geist-sans), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const typography: TypographyVariantsOptions = {
  fontFamily,
  h1: { fontFamily, fontWeight: 600, fontSize: "2.5rem", lineHeight: 1.2, letterSpacing: "-0.02em" },
  h2: { fontFamily, fontWeight: 600, fontSize: "2rem", lineHeight: 1.25, letterSpacing: "-0.02em" },
  h3: { fontFamily, fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
  h4: { fontFamily, fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.35 },
  h5: { fontFamily, fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4 },
  h6: { fontFamily, fontWeight: 600, fontSize: "1rem", lineHeight: 1.4 },
  subtitle1: { fontFamily, fontWeight: 500, fontSize: "1rem", lineHeight: 1.5 },
  subtitle2: { fontFamily, fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5 },
  body1: { fontFamily, fontWeight: 400, fontSize: "0.9375rem", lineHeight: 1.6 },
  body2: { fontFamily, fontWeight: 400, fontSize: "0.8125rem", lineHeight: 1.55 },
  button: { fontFamily, fontWeight: 600, fontSize: "0.875rem", textTransform: "none", letterSpacing: 0 },
  caption: { fontFamily, fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.5 },
  overline: {
    fontFamily,
    fontWeight: 600,
    fontSize: "0.6875rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
};
