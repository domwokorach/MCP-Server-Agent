"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/ui/pin-input";
import { SectionCard } from "@/components/ui";
import { ApiError } from "@/lib/api-client";
import { verifyEmail, resendVerification } from "@/services/authService";

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (code: string) => {
    setError(null);
    setExpired(false);
    setStatus("submitting");
    try {
      await verifyEmail({ email, pin: code });
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err) {
      setStatus("idle");
      setPin("");
      if (err instanceof ApiError) {
        setExpired(/expired|too many/i.test(err.message));
        setError(err.message);
      } else {
        setError("Unable to verify your code.");
      }
    }
  };

  const handlePinChange = (next: string) => {
    setPin(next);
    if (next.length === 6 && status !== "submitting") {
      void handleVerify(next);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setExpired(false);
    try {
      await resendVerification(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setResent(true);
      setPin("");
      setTimeout(() => setResent(false), 4000);
    } catch {
      setError("Unable to resend the code. Try again shortly.");
    } finally {
      setResending(false);
    }
  };

  if (status === "success") {
    return (
      <SectionCard title="Email verified" subtitle="Your account is now active.">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <p className="text-sm text-muted-foreground">Taking you to your dashboard…</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Verify your email" subtitle="Enter the 6-digit code we sent to your inbox.">
      <div className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              {expired && (
                <>
                  {" "}
                  <button type="button" onClick={handleResend} className="font-medium underline underline-offset-2">
                    Send a new code
                  </button>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
        {resent && (
          <Alert className="border-success/30 bg-success/10">
            <AlertDescription className="text-success">A new code is on its way.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="verify-email">Email</Label>
          <Input
            id="verify-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === "submitting"}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-center block">Verification code</Label>
          <PinInput
            value={pin}
            onChange={handlePinChange}
            disabled={status === "submitting"}
            invalid={!!error && !expired}
            autoFocus
          />
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={status === "submitting" || pin.length !== 6 || !email}
          onClick={() => handleVerify(pin)}
        >
          {status === "submitting" ? "Verifying…" : "Verify account"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          {cooldown > 0 ? (
            <span>
              Resend code in <span className="tabular-nums">{Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, "0")}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </SectionCard>
  );
}
