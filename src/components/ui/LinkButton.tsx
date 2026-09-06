"use client";

import type { ReactNode } from "react";
import Button from "@mui/material/Button";
import Link from "next/link";

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: "text" | "outlined" | "contained";
  startIcon?: ReactNode;
}

export function LinkButton({ href, children, variant = "contained", startIcon }: LinkButtonProps) {
  return (
    <Button component={Link} href={href} variant={variant} startIcon={startIcon}>
      {children}
    </Button>
  );
}
