import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Breadcrumbs } from "./Breadcrumbs";
import type { HeaderBreadcrumb } from "./types";

interface PageTitleProps {
  title: string;
  description?: string;
  breadcrumbs?: HeaderBreadcrumb[];
}

export function PageTitle({ title, description, breadcrumbs }: PageTitleProps) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <Typography
        component="h1"
        noWrap
        sx={{
          color: "var(--header-title)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          fontSize: { xs: "1.25rem", sm: "1.5rem", lg: "1.75rem" },
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          sx={{
            color: "var(--header-muted)",
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          }}
        >
          {description}
        </Typography>
      )}
    </Stack>
  );
}
