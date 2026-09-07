"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { SectionCard } from "@/components/ui";
import { ApiError } from "@/lib/api-client";
import { resetPassword } from "@/services/authService";
import { resetPasswordSchema, type ResetPasswordValues } from "./schemas";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(!token);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token } });
  const password = watch("password") ?? "";

  const onSubmit = async (values: ResetPasswordValues) => {
    setServerError(null);
    try {
      await resetPassword(values);
      router.push("/login");
    } catch (error) {
      if (error instanceof ApiError && /invalid or has expired/i.test(error.message)) {
        setLinkExpired(true);
        return;
      }
      setServerError(error instanceof Error ? error.message : "Unable to reset password.");
    }
  };

  if (linkExpired) {
    return (
      <SectionCard title="Link expired" subtitle="This password reset link is invalid or has expired.">
        <div className="space-y-5">
          <Alert variant="destructive">
            <AlertDescription>Request a new reset link to continue.</AlertDescription>
          </Alert>
          <Button
            render={<Link href="/forgot-password" />}
            nativeButton={false}
            size="lg"
            className="w-full"
          >
            Request a new link
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Set a new password" subtitle="Choose a strong password for your account.">
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && <Alert variant="destructive"><AlertDescription>{serverError}</AlertDescription></Alert>}
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
          <PasswordStrengthMeter password={password} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </SectionCard>
  );
}
