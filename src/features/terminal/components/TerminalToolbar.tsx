"use client";

import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import { Clock3, Copy, Maximize2, Minimize2, RefreshCw, Trash2, ArrowDownToLine } from "lucide-react";

interface TerminalToolbarProps {
  fullscreen: boolean;
  showTimestamps: boolean;
  autoScroll: boolean;
  onToggleFullscreen: () => void;
  onToggleTimestamps: () => void;
  onToggleAutoScroll: () => void;
  onClear: () => void;
  onCopy: () => void;
  onReconnect: () => void;
}

export function TerminalToolbar({
  fullscreen,
  showTimestamps,
  autoScroll,
  onToggleFullscreen,
  onToggleTimestamps,
  onToggleAutoScroll,
  onClear,
  onCopy,
  onReconnect,
}: TerminalToolbarProps) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: "center",
        gap: 0.5,
        minWidth: 0,
        overflowX: "auto",
        overscrollBehaviorX: "contain",
        pb: 0.5,
        "& > *": { flexShrink: 0 },
      }}
    >
      <Tooltip title="Reconnect">
        <IconButton size="small" aria-label="Reconnect" onClick={onReconnect}>
          <RefreshCw size={20} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Clear terminal">
        <IconButton size="small" aria-label="Clear terminal" onClick={onClear}>
          <Trash2 size={20} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy output">
        <IconButton size="small" aria-label="Copy output" onClick={onCopy}>
          <Copy size={20} />
        </IconButton>
      </Tooltip>
      <Tooltip title={showTimestamps ? "Hide timestamps" : "Show timestamps"}>
        <ToggleButton
          size="small"
          value="timestamps"
          selected={showTimestamps}
          onChange={onToggleTimestamps}
          aria-label="Toggle timestamps"
        >
          <Clock3 size={20} />
        </ToggleButton>
      </Tooltip>
      <Tooltip title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}>
        <ToggleButton
          size="small"
          value="autoscroll"
          selected={autoScroll}
          onChange={onToggleAutoScroll}
          aria-label="Toggle auto-scroll"
        >
          <ArrowDownToLine size={20} />
        </ToggleButton>
      </Tooltip>
      <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
        <IconButton size="small" aria-label="Toggle fullscreen" onClick={onToggleFullscreen}>
          {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
