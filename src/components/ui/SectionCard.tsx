import type { ReactNode } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function SectionCard({ title, subtitle, action, children, noPadding, className }: SectionCardProps) {
  return (
    <Card className={cn("rounded-2xl border border-border bg-card py-0 shadow-sm", className)}>
      {(title || action) && (
        <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={noPadding ? "px-0 pb-0" : "px-5 pb-5 sm:px-6 sm:pb-6"}>
        {children}
      </CardContent>
    </Card>
  );
}
