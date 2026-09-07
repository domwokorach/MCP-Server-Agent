"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import { login } from "@/services/authService";
import { loginSchema, type LoginValues } from "./schemas";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await login(values);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }
      setServerError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  return (
    <SectionCard title="Sign in" subtitle="Welcome back — manage your devices and agents.">
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && <Alert variant="destructive"><AlertDescription>{serverError}</AlertDescription></Alert>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <div className="relative py-1 text-center text-xs text-muted-foreground before:absolute before:inset-x-0 before:top-1/2 before:border-t before:border-border">
          <span className="relative bg-card px-3">or continue with</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href="/api/auth/google" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>Google</a>
          <a href="/api/auth/github" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>GitHub</a>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account? <Link href="/register" className="font-medium text-primary hover:underline">Create one</Link>
        </p>
      </form>
    </SectionCard>
  );
}
