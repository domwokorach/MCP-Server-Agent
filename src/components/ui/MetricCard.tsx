import type { ReactNode } from "react";
import { Card, CardContent } from "./card";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
}

export function MetricCard({ label, value, icon, trend }: MetricCardProps) {
  return (
    <Card className="h-full rounded-2xl border border-border py-0 shadow-sm">
      <CardContent className="flex items-start justify-between px-5 py-5 sm:px-6">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
          <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {trend && (
            <p className={`text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>{trend.value}</p>
          )}
        </div>
        {icon && (
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
