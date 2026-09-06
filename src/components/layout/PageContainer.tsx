import type { ReactNode } from "react";
import Box from "@mui/material/Box";

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 3, sm: 4, lg: 5 },
        maxWidth: "var(--content-max-width)",
        mx: "auto",
        width: "100%",
      }}
    >
      {children}
    </Box>
  );
}
