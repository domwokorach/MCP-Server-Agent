"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { SectionCard } from "@/components/ui";
import { getCurrentUser, logout, updateProfile } from "@/services/authService";
import type { User } from "@/types";

export function ProfileSettings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    getCurrentUser().then((current) => {
      if (!current) return;
      setUser(current);
      setFullName(current.fullName);
      setAddress(current.address ?? "");
    });
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    try {
      const updated = await updateProfile({ fullName, address });
      setUser(updated);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  if (!user) return null;

  return (
    <SectionCard title="Profile" subtitle="Your account information.">
      <Stack direction="row" spacing={2.5} sx={{ alignItems: "center", mb: 2.5 }}>
        <Avatar sx={{ width: 56, height: 56, fontSize: "1.25rem" }}>
          {user.fullName
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </Avatar>
      </Stack>
      <Stack spacing={2.5}>
        {status === "saved" && <Alert severity="success">Profile updated.</Alert>}
        {status === "error" && <Alert severity="error">Unable to save changes.</Alert>}
        <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth />
        <TextField label="Email" defaultValue={user.email} fullWidth disabled />
        <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
        <TextField label="Role" defaultValue={user.role} fullWidth disabled />
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={handleSave} disabled={status === "saving"}>
            Save changes
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => void logout().then(() => router.push("/login"))}
          >
            Sign out
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
}

