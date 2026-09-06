import { createTheme } from "@mui/material/styles";
import { lightPalette, darkPalette } from "./palette";
import { typography } from "./typography";
import { components } from "./components";
import { radius, shadows, breakpointValues } from "./tokens";

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: '[data-theme="%s"]',
  },
  colorSchemes: {
    light: lightPalette,
    dark: darkPalette,
  },
  shape: {
    borderRadius: radius.md,
  },
  breakpoints: {
    values: breakpointValues,
  },
  typography,
  spacing: 8,
  custom: {
    radius,
    shadows,
  },
  components,
});

export default theme;
