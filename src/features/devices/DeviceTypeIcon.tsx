import { Laptop, Monitor, Smartphone, type LucideIcon, type LucideProps } from "lucide-react";
import type { DeviceType } from "@/types";

const iconMap: Record<DeviceType, LucideIcon> = {
  mobile: Smartphone,
  desktop: Monitor,
  laptop: Laptop,
};

export function DeviceTypeIcon({ type, ...props }: { type: DeviceType } & LucideProps) {
  const Icon = iconMap[type];
  return <Icon size={20} {...props} />;
}
