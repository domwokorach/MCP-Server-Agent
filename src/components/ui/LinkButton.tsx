"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: "text" | "outlined" | "contained";
  startIcon?: ReactNode;
}

export function LinkButton({ href, children, variant = "contained", startIcon }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: variant === "contained" ? "default" : variant === "outlined" ? "outline" : "link" }))}
    >
      {startIcon}
      {children}
    </Link>
  );
}
