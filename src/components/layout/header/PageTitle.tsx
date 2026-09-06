import { Breadcrumbs } from "./Breadcrumbs";
import type { HeaderBreadcrumb } from "./types";

interface PageTitleProps {
  title: string;
  description?: string;
  breadcrumbs?: HeaderBreadcrumb[];
}

export function PageTitle({ title, description, breadcrumbs }: PageTitleProps) {
  return (
    <div className="min-w-0 space-y-0.5">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-[1.75rem]">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
