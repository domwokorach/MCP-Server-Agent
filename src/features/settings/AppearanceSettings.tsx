"use client";

import { MonitorCog, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui";
import { useColorMode } from "@/hooks/useColorMode";

const modes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: MonitorCog },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function AppearanceSettings() {
  const { mode, setMode } = useColorMode();

  return (
    <SectionCard title="Appearance" subtitle="Choose how My Agent Platform looks on this device.">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Theme</p>
        <div className="inline-flex w-full rounded-xl bg-muted p-1 sm:w-auto">
          {modes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={mode === value ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode(value)}
              className="flex-1 rounded-lg sm:flex-none"
              aria-pressed={mode === value}
            >
              <Icon size={16} />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
