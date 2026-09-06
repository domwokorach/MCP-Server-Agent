import type { Components, Theme } from "@mui/material/styles";
import { radius } from "./tokens";

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      "*": { boxSizing: "border-box" },
      html: { WebkitFontSmoothing: "antialiased" },
      "@media (prefers-reduced-motion: reduce)": {
        "*": {
          animationDuration: "0.001ms !important",
          animationIterationCount: "1 !important",
          transitionDuration: "0.001ms !important",
          scrollBehavior: "auto !important",
        },
      },
    },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: "none",
        border: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
        minHeight: "var(--control-height)",
        paddingInline: 16,
        paddingBlock: 8,
      },
      sizeSmall: { minHeight: "var(--control-height-sm)" },
      sizeLarge: { minHeight: 52, paddingInline: 20, paddingBlock: 11 },
      outlined: ({ theme }) => ({
        borderColor: theme.palette.divider,
        "&:hover": { borderColor: theme.palette.primary.main, backgroundColor: "transparent" },
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: { borderRadius: radius.sm, minWidth: "var(--control-height)", minHeight: "var(--control-height)" },
      sizeSmall: { minWidth: "var(--control-height-sm)", minHeight: "var(--control-height-sm)" },
    },
  },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: radius.lg,
        border: `1px solid ${theme.palette.divider}`,
        backgroundImage: "none",
      }),
    },
  },
  MuiTextField: {
    defaultProps: { size: "medium" },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: radius.sm,
        "&:not(.MuiInputBase-multiline)": { minHeight: "var(--field-height)" },
      },
      input: {
        padding: "14px 16px",
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: { borderRadius: radius.sm, minWidth: "var(--control-height)", minHeight: "var(--control-height)" },
      sizeSmall: { minWidth: "var(--control-height-sm)", minHeight: "var(--control-height-sm)" },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: radius.sm, fontWeight: 600 },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundImage: "none",
      }),
    },
  },
  MuiAppBar: {
    defaultProps: { elevation: 0, color: "transparent" },
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: "blur(8px)",
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({ borderColor: theme.palette.divider }),
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: { borderRadius: radius.sm, fontSize: "0.75rem" },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: radius.lg },
    },
  },
  MuiLink: {
    defaultProps: { underline: "hover" },
  },
};
