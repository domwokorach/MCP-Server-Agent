"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";

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
    <Box aria-label="Pairing pattern" role="img" sx={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: "2px", width: 164, height: 164, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      {cells.map((filled, index) => <Box key={index} sx={{ bgcolor: filled ? "text.primary" : "transparent", borderRadius: "1px" }} />)}
    </Box>
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
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 7 }}>
        <SectionCard title="Secure pairing" subtitle="Pairing requires a short-lived code, a signed-in companion app, and your approval.">
          <Stack spacing={3}>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {["Choose device", "Generate code", "Sign in", "Approve", "Connected"].map((label, index) => (
                <Typography key={label} variant="caption" sx={{ fontWeight: step === ["select", "code", "sign-in", "approval", "connected"][index] ? 700 : 400, color: index <= ["select", "code", "sign-in", "approval", "connected"].indexOf(step) ? "primary.main" : "text.secondary" }}>{index + 1}. {label}</Typography>
              ))}
            </Stack>

            {step === "select" && (
              <>
                <Typography variant="body2" color="text.secondary">Choose the kind of device using the companion application.</Typography>
                <Grid container spacing={1.5}>
                  {deviceTypes.map((item) => (
                    <Grid key={item.type} size={{ xs: 12, sm: 4 }}>
                      <Button fullWidth variant={type === item.type ? "contained" : "outlined"} onClick={() => setType(item.type)} sx={{ minHeight: 118, alignItems: "flex-start", justifyContent: "flex-start", textAlign: "left", p: 2 }}>
                        <Stack spacing={1}><DeviceTypeIcon type={item.type} size={24} /><Box><Typography sx={{ fontWeight: 700 }}>{item.label}</Typography><Typography variant="caption" sx={{ opacity: 0.85, textTransform: "none", display: "block" }}>{item.description}</Typography></Box></Stack>
                      </Button>
                    </Grid>
                  ))}
                </Grid>
                <Button variant="contained" startIcon={<KeyRound size={18} />} onClick={generateCode} disabled={pending} sx={{ alignSelf: "flex-start" }}>{pending ? "Generating…" : "Generate pairing code"}</Button>
              </>
            )}

            {step === "code" && pairing && (
              <Stack spacing={2}>
                <Typography variant="body2">Open the companion app on the selected device and enter this one-time code, or scan the pairing pattern.</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: { sm: "center" } }}>
                  <PairingPattern code={pairing.code} />
                  <Box><Typography variant="h4" sx={{ fontFamily: "var(--font-geist-mono)", letterSpacing: "0.08em" }}>{pairing.code}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Expires {formatDateTime(pairing.expiresAt)}</Typography></Box>
                </Stack>
                <Button variant="contained" onClick={() => setStep("sign-in")} sx={{ alignSelf: "flex-start" }}>I entered the code</Button>
              </Stack>
            )}

            {step === "sign-in" && (
              <Stack spacing={2}>
                <Typography variant="body2">Sign in to the companion app with the same account, then return here. The device receives no management credential from this page.</Typography>
                <Button variant="contained" onClick={() => setStep("approval")} sx={{ alignSelf: "flex-start" }}>Companion app is signed in</Button>
              </Stack>
            )}

            {step === "approval" && (
              <Stack spacing={2}>
                <Alert icon={<ShieldCheck size={20} />} severity="info">Review the device type and approve its console connection. This grants only MCP and agent task access.</Alert>
                <Button variant="contained" startIcon={<ShieldCheck size={18} />} onClick={approve} disabled={pending} sx={{ alignSelf: "flex-start" }}>{pending ? "Approving…" : "Approve device"}</Button>
              </Stack>
            )}

            {step === "connected" && device && (
              <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "success.main" }}><CheckCircle2 size={24} /><Typography variant="h6">Device connected</Typography></Stack>
                <Typography variant="body2" color="text.secondary">{device.name} is now connected to the console. You can review its network approval, MCP connection, and agent task scope.</Typography>
                <Button component={Link} href={`/dashboard/devices/${device.id}`} variant="contained">View device</Button>
              </Stack>
            )}
          </Stack>
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <SectionCard title="What approval allows">
          <Stack spacing={2}>
            <Typography variant="body2"><strong>Connection health:</strong> review application, MCP, and agent connection state.</Typography>
            <Typography variant="body2"><strong>Task orchestration:</strong> queue approved AI-agent tasks and inspect their history.</Typography>
            <Typography variant="body2"><strong>No direct device control:</strong> pairing does not expose hardware controls, shell access, or device credentials.</Typography>
          </Stack>
        </SectionCard>
      </Grid>
    </Grid>
  );
}
