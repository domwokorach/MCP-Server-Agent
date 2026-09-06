import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HeaderBreadcrumb } from "./types";

export function Breadcrumbs({ items }: { items: HeaderBreadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-1 hidden min-w-0 items-center gap-1.5 overflow-hidden text-xs sm:flex">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const label = <span className={`truncate ${isLast ? "font-medium text-foreground" : "text-muted-foreground"}`}>{item.label}</span>;

        if (item.href && !isLast) {
          return (
            <span key={item.label} className="flex min-w-0 items-center gap-1.5">
              <Link href={item.href} className="min-w-0 transition-colors hover:text-foreground">{label}</Link>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            </span>
          );
        }
        return <span key={item.label}>{label}</span>;
      })}
    </nav>
  );
}
