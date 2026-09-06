"use client";

import { useMemo, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { HeaderNotification } from "./types";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

interface NotificationButtonProps {
  notifications?: HeaderNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export function NotificationButton({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationButtonProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
                />
              }
            />
          }
        >
          <span className="relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <Badge className="absolute -right-2.5 -top-2 h-4 min-w-4 justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-[min(22.5rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-medium">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={onMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <BellOff className="size-6" />
            <p>You&rsquo;re all caught up. No notifications yet.</p>
          </div>
        ) : (
          <div className="max-h-90 overflow-y-auto">
            {notifications.map((notification) => (
              <Button
                key={notification.id}
                onClick={() => onMarkAsRead?.(notification.id)}
                variant="ghost"
                className={`h-auto w-full justify-start rounded-none border-b border-border px-4 py-3 text-left font-normal last:border-0 hover:bg-muted/70 ${notification.read ? "" : "bg-primary/5"}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-medium text-foreground">{notification.title}</span>
                  {!notification.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                </span>
                {notification.description && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{notification.description}</span>}
                <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground">{formatTimestamp(notification.timestamp)}</span>
              </Button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
