"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Link from "next/link";
import Typography from "@mui/material/Typography";

import { SectionCard } from "@/components/ui";
import { requestPasswordReset } from "@/services/authService";
import { forgotPasswordSchema, type ForgotPasswordValues } from "./schemas";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setServerError(null);
    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to send reset link.");
    }
  };

  return (
    <SectionCard title="Reset your password" subtitle="We'll email you a link to get back in.">
      {sent ? (
        <Alert severity="success">Check your inbox for a password reset link.</Alert>
      ) : (
        <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </Stack>
      )}
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          textAlign: "center",
          mt: 2.5
        }}>
        <Link href="/login">Back to sign in</Link>
      </Typography>
    </SectionCard>
  );
}
