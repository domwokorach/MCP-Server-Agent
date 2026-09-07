"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui";
import { getCurrentUser, logout, updateProfile } from "@/services/authService";
import type { User } from "@/types";

export function ProfileSettings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "logging-out" | "error">("idle");

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

  const handleLogout = async () => {
    setStatus("logging-out");
    try {
      await logout();
      window.dispatchEvent(new Event("auth:logout"));
      router.replace("/login");
      router.refresh();
    } catch {
      setStatus("error");
    }
  };

  if (!user) return null;
  const initials = user.fullName.split(" ").map((part) => part[0]).join("");

  return (
    <SectionCard title="Profile" subtitle="Your account information.">
      <div className="space-y-5">
        <Avatar className="size-14">
          <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        {status === "saved" && <Alert className="border-success/30 bg-success/10 text-success"><AlertDescription className="text-success">Profile updated.</AlertDescription></Alert>}
        {status === "error" && <Alert variant="destructive"><AlertDescription>Unable to save changes.</AlertDescription></Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="full-name">Full name</Label><Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={user.email} disabled /></div>
          <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="role">Role</Label><Input id="role" value={user.role} disabled /></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={status === "saving"}>{status === "saving" ? "Saving…" : "Save changes"}</Button>
          <Button variant="outline" disabled={status === "logging-out"} onClick={() => void handleLogout()}>
            {status === "logging-out" ? "Logging out..." : "Sign out"}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
