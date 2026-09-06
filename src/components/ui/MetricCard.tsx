import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
}

export function MetricCard({ label, value, icon, trend }: MetricCardProps) {
  return (
    <Card sx={{ borderRadius: "var(--radius-lg)", p: 3, height: "100%" }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between"
        }}>
        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {label}
          </Typography>
          <Typography variant="h3" component="p">
            {value}
          </Typography>
          {trend && (
            <Typography
              variant="caption"
              sx={{ color: trend.positive ? "success.main" : "error.main", fontWeight: 600 }}
            >
              {trend.value}
            </Typography>
          )}
        </Stack>
        {icon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              bgcolor: "action.hover",
              color: "primary.main",
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
    </Card>
  );
}
