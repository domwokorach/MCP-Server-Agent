"use client";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MonitorCog, Moon, Sun } from "lucide-react";
import { useColorScheme } from "@mui/material/styles";

import { SectionCard } from "@/components/ui";

export function AppearanceSettings() {
  const { mode, setMode } = useColorScheme();

  return (
    <SectionCard title="Appearance" subtitle="Choose how My Agent Platform looks on this device.">
      <Stack spacing={2}>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Theme
        </Typography>
        <ToggleButtonGroup
          value={mode ?? "system"}
          exclusive
          onChange={(_, value) => value && setMode(value)}
          aria-label="Color mode"
        >
          <ToggleButton value="light" aria-label="Light mode">
            <Sun size={18} style={{ marginRight: 8 }} /> Light
          </ToggleButton>
          <ToggleButton value="system" aria-label="System mode">
            <MonitorCog size={18} style={{ marginRight: 8 }} /> System
          </ToggleButton>
          <ToggleButton value="dark" aria-label="Dark mode">
            <Moon size={18} style={{ marginRight: 8 }} /> Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </SectionCard>
  );
}
