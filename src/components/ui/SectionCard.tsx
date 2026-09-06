import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}

export function SectionCard({ title, subtitle, action, children, noPadding }: SectionCardProps) {
  return (
    <Card sx={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      {(title || action) && (
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2.5, sm: 4 },
            pt: { xs: 2.5, sm: 3.5 },
            pb: subtitle ? 0.5 : 2.5
          }}>
          <Box>
            {title && (
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Stack>
      )}
      <Box
        sx={{
          px: noPadding ? 0 : { xs: 2.5, sm: 4 },
          pb: noPadding ? 0 : { xs: 2.5, sm: 4 },
          pt: title ? 1.5 : { xs: 2.5, sm: 4 },
        }}
      >
        {children}
      </Box>
    </Card>
  );
}
