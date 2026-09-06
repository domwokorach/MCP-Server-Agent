"use client";

import { ArrowDownToLine, Clock3, Copy, Maximize2, Minimize2, RefreshCw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

function Action({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant={active ? "secondary" : "ghost"} size="icon-sm" aria-label={label} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function TerminalToolbar(props: TerminalToolbarProps) {
  return (
    <div className="flex min-w-0 gap-1 overflow-x-auto pb-1">
      <Action label="Reconnect" onClick={props.onReconnect}><RefreshCw size={18} /></Action>
      <Action label="Clear terminal" onClick={props.onClear}><Trash2 size={18} /></Action>
      <Action label="Copy output" onClick={props.onCopy}><Copy size={18} /></Action>
      <Action label={props.showTimestamps ? "Hide timestamps" : "Show timestamps"} onClick={props.onToggleTimestamps} active={props.showTimestamps}><Clock3 size={18} /></Action>
      <Action label={props.autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"} onClick={props.onToggleAutoScroll} active={props.autoScroll}><ArrowDownToLine size={18} /></Action>
      <Action label={props.fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={props.onToggleFullscreen}>
        {props.fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </Action>
    </div>
  );
}
