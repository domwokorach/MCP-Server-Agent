export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordStrengthResult {
  score: number; // 0-4
  label: PasswordStrength;
}

const LABELS: PasswordStrength[] = ["weak", "weak", "fair", "good", "strong"];

/** Lightweight heuristic strength meter — not a substitute for server-side validation. */
export function scorePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: "weak" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const clamped = Math.min(score, 4);
  return { score: clamped, label: LABELS[clamped] };
}
