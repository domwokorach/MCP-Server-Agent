import type { ColorSystemOptions } from "@mui/material/styles";

const brand = {
  50: "#f1f0ff",
  100: "#e3e1ff",
  200: "#c8c3ff",
  300: "#a79dff",
  400: "#8a7bff",
  500: "#6c5cf5",
  600: "#5643e0",
  700: "#4433b8",
  800: "#372a92",
  900: "#2b2172",
};

const neutral = {
  0: "#ffffff",
  50: "#f7f8fb",
  100: "#f3f5f8",
  200: "#e5e7eb",
  300: "#d0d5dd",
  400: "#98a2b3",
  500: "#667085",
  600: "#475467",
  700: "#344054",
  800: "#1d2129",
  900: "#171a21",
  950: "#0f1115",
};

export const lightPalette: ColorSystemOptions = {
  palette: {
    mode: "light",
    primary: {
      main: brand[500],
      light: brand[300],
      dark: brand[700],
      contrastText: "#ffffff",
    },
    secondary: {
      main: neutral[700],
      light: neutral[500],
      dark: neutral[900],
      contrastText: "#ffffff",
    },
    success: { main: "#16a34a" },
    warning: { main: "#d97706" },
    error: { main: "#dc2626" },
    info: { main: "#0284c7" },
    background: {
      default: "#f7f8fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#111318",
      secondary: neutral[500],
    },
    divider: neutral[200],
  },
};

export const darkPalette: ColorSystemOptions = {
  palette: {
    mode: "dark",
    primary: {
      main: brand[400],
      light: brand[300],
      dark: brand[600],
      contrastText: "#111318",
    },
    secondary: {
      main: neutral[300],
      light: neutral[200],
      dark: neutral[500],
      contrastText: "#111318",
    },
    success: { main: "#22c55e" },
    warning: { main: "#f59e0b" },
    error: { main: "#f87171" },
    info: { main: "#38bdf8" },
    background: {
      default: "#0f1115",
      paper: "#171a21",
    },
    text: {
      primary: "#f9fafb",
      secondary: neutral[400],
    },
    divider: neutral[800],
  },
};

export { brand, neutral };
