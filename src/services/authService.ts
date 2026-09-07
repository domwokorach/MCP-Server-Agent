import { apiClient } from "@/lib/api-client";
import type { User } from "@/types";

export interface RegisterInput {
  fullName: string;
  email: string;
  address: string;
  password: string;
  confirmPassword: string;
}

export async function login(input: { email: string; password: string }): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>("/auth/login", input);
  return data.user;
}

export async function register(input: RegisterInput): Promise<{ email: string }> {
  const { data } = await apiClient.post<{ email: string }>("/auth/register", input);
  return data;
}

export async function verifyEmail(input: { email: string; pin: string }): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>("/auth/verify-email", input);
  return data.user;
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/resend-verification", { email });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await apiClient.get<{ user: User }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

export async function updateProfile(input: { fullName?: string; address?: string }): Promise<User> {
  const { data } = await apiClient.patch<{ user: User }>("/auth/me", input);
  return data.user;
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>("/auth/reset-password", input);
  return data;
}
