"use client";

import { scorePasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

const LABEL_TEXT: Record<string, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

const LABEL_COLOR: Record<string, string> = {
  weak: "text-destructive",
  fair: "text-warning",
  good: "text-info",
  strong: "text-success",
};

const BAR_COLOR: Record<string, string> = {
  weak: "bg-destructive",
  fair: "bg-warning",
  good: "bg-info",
  strong: "bg-success",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = scorePasswordStrength(password);

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn("h-1.5 flex-1 rounded-full bg-muted transition-colors", i < score && BAR_COLOR[label])}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", LABEL_COLOR[label])}>{LABEL_TEXT[label]} password</p>
    </div>
  );
}
