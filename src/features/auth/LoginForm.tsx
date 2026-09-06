"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import { SectionCard } from "@/components/ui";
import { login } from "@/services/authService";
import { loginSchema, type LoginValues } from "./schemas";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await login(values);
      router.push("/dashboard");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  return (
    <SectionCard title="Sign in" subtitle="Welcome back — manage your devices and agents.">
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
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          fullWidth
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <Stack direction="row" sx={{
          justifyContent: "flex-end"
        }}>
          <Link href="/forgot-password" style={{ fontSize: "0.8125rem" }}>
            Forgot password?
          </Link>
        </Stack>
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <Divider flexItem>or</Divider>
        <Button href="/api/auth/google" variant="outlined" size="large" fullWidth>
          Continue with Google
        </Button>
        <Button href="/api/auth/github" variant="outlined" size="large" fullWidth>
          Continue with GitHub
        </Button>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            textAlign: "center"
          }}>
          Don&apos;t have an account? <Link href="/register">Create one</Link>
        </Typography>
      </Stack>
    </SectionCard>
  );
}
