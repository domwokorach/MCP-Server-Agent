import type { radius, shadows } from "./tokens";

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      radius: typeof radius;
      shadows: typeof shadows;
    };
  }
  interface ThemeOptions {
    custom?: {
      radius?: typeof radius;
      shadows?: typeof shadows;
    };
  }
}
