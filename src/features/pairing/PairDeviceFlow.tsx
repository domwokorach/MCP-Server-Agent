"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { Device, DeviceType } from "@/types";
import { DeviceTypeIcon } from "@/features/devices/DeviceTypeIcon";

type Step = "select" | "code" | "sign-in" | "approval" | "connected";

const deviceTypes: Array<{ type: DeviceType; label: string; description: string }> = [
  { type: "mobile", label: "Mobile", description: "Phone or tablet companion app" },
  { type: "desktop", label: "Desktop", description: "Workstation companion app" },
  { type: "laptop", label: "Laptop", description: "Portable computer companion app" },
];

function PairingPattern({ code }: { code: string }) {
  const cells = useMemo(() => {
    const seed = [...code].reduce((total, character) => total + character.charCodeAt(0), 17);
    return Array.from({ length: 121 }, (_, index) => {
      const value = (seed * (index + 3) + code.charCodeAt(index % code.length) * (index + 11)) % 97;
      return value % 3 === 0 || index < 11 || index % 11 === 0;
    });
  }, [code]);

  return (
    <div aria-label="Pairing pattern" role="img" className="grid size-41 grid-cols-11 gap-0.5 rounded-xl border border-border p-2">
      {cells.map((filled, index) => <span key={index} className={`rounded-[1px] ${filled ? "bg-foreground" : ""}`} />)}
    </div>
  );
}

async function requestPairing(body: Record<string, string>) {
  const response = await fetch("/api/devices/pair", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mcp-csrf": "1" },
    body: JSON.stringify(body),
  });
  return response.json();
}

export function PairDeviceFlow() {
  const [type, setType] = useState<DeviceType>("mobile");
  const [step, setStep] = useState<Step>("select");
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const steps: Step[] = ["select", "code", "sign-in", "approval", "connected"];

  const generateCode = async () => {
    setPending(true);
    setError(null);
    const result = await requestPairing({ action: "generate", type });
    setPending(false);
    if (!result.code) return setError(result.message ?? "Unable to generate a pairing code.");
    setPairing(result);
    setStep("code");
  };
  const approve = async () => {
    if (!pairing) return;
    setPending(true);
    setError(null);
    const result = await requestPairing({ action: "approve", type, code: pairing.code });
    setPending(false);
    if (!result.success) return setError(result.message ?? "Unable to approve this device.");
    setDevice(result.device);
    setStep("connected");
  };

  return (
    <div className="grid gap-5 md:grid-cols-12">
      <SectionCard title="Secure pairing" subtitle="Pairing requires a short-lived code, a signed-in companion app, and your approval." className="md:col-span-7">
        <div className="space-y-6">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <ol className="flex flex-wrap gap-x-4 gap-y-2">
            {["Choose device", "Generate code", "Sign in", "Approve", "Connected"].map((label, index) => (
              <li key={label} className={`text-xs ${index <= steps.indexOf(step) ? "font-medium text-primary" : "text-muted-foreground"}`}>{index + 1}. {label}</li>
            ))}
          </ol>

          {step === "select" && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">Choose the kind of device using the companion application.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {deviceTypes.map((item) => (
                  <Button
                    key={item.type}
                    variant={type === item.type ? "default" : "outline"}
                    onClick={() => setType(item.type)}
                    className="h-auto min-h-30 items-start justify-start whitespace-normal rounded-xl p-4 text-left"
                  >
                    <span className="space-y-2">
                      <DeviceTypeIcon type={item.type} size={22} />
                      <span className="block font-medium">{item.label}</span>
                      <span className="block text-xs font-normal opacity-75">{item.description}</span>
                    </span>
                  </Button>
                ))}
              </div>
              <Button onClick={() => void generateCode()} disabled={pending}><KeyRound size={18} />{pending ? "Generating…" : "Generate pairing code"}</Button>
            </div>
          )}

          {step === "code" && pairing && (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">Open the companion app on the selected device and enter this one-time code, or scan the pairing pattern.</p>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <PairingPattern code={pairing.code} />
                <div>
                  <p className="font-mono text-2xl font-semibold tracking-[0.12em]">{pairing.code}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Expires {formatDateTime(pairing.expiresAt)}</p>
                </div>
              </div>
              <Button onClick={() => setStep("sign-in")}>I entered the code</Button>
            </div>
          )}

          {step === "sign-in" && (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">Sign in to the companion app with the same account, then return here. The device receives no management credential from this page.</p>
              <Button onClick={() => setStep("approval")}>Companion app is signed in</Button>
            </div>
          )}

          {step === "approval" && (
            <div className="space-y-5">
              <Alert><ShieldCheck className="size-4 text-info" /><AlertDescription>Review the device type and approve its console connection. This grants only MCP and agent task access.</AlertDescription></Alert>
              <Button onClick={() => void approve()} disabled={pending}><ShieldCheck size={18} />{pending ? "Approving…" : "Approve device"}</Button>
            </div>
          )}

          {step === "connected" && device && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-success"><CheckCircle2 size={22} /><p className="font-medium">Device connected</p></div>
              <p className="text-sm leading-6 text-muted-foreground">{device.name} is now connected to the console. You can review its network approval, MCP connection, and agent task scope.</p>
              <Button render={<Link href={`/dashboard/devices/${device.id}`} />} nativeButton={false}>View device</Button>
            </div>
          )}
        </div>
      </SectionCard>
      <SectionCard title="What approval allows" className="md:col-span-5">
        <div className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p><strong className="text-foreground">Connection health:</strong> review application, MCP, and agent connection state.</p>
          <p><strong className="text-foreground">Task orchestration:</strong> queue approved AI-agent tasks and inspect their history.</p>
          <p><strong className="text-foreground">No direct device control:</strong> pairing does not expose hardware controls, shell access, or device credentials.</p>
        </div>
      </SectionCard>
    </div>
  );
}
