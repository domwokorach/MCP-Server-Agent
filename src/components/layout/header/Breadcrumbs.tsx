import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HeaderBreadcrumb } from "./types";

export function Breadcrumbs({ items }: { items: HeaderBreadcrumb[] }) {
  return (
    <MuiBreadcrumbs
      aria-label="Breadcrumb"
      separator={<ChevronRight size={14} color="var(--header-muted)" />}
      sx={{
        display: { xs: "none", sm: "flex" },
        mb: 0.25,
        "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" },
        "& .MuiBreadcrumbs-li": { minWidth: 0 },
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const label = (
          <Typography
            noWrap
            component="span"
            sx={{
              fontSize: "0.8125rem",
              fontWeight: isLast ? 600 : 500,
              color: isLast ? "var(--header-title)" : "var(--header-muted)",
              transition: "color 0.15s ease",
            }}
          >
            {item.label}
          </Typography>
        );

        if (item.href && !isLast) {
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{ textDecoration: "none" }}
              className="header-breadcrumb-link"
            >
              {label}
            </Link>
          );
        }
        return <span key={item.label}>{label}</span>;
      })}
    </MuiBreadcrumbs>
  );
}
