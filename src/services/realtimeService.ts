import type { Device, DeviceStatus } from "@/types";

export type DeviceUpdateEvent = {
  deviceId: string;
  status: DeviceStatus;
  lastSeen: string;
};

type Listener = (event: DeviceUpdateEvent) => void;

/**
 * Simulates a WebSocket connection streaming device status changes.
 * Swap the internals for a real `new WebSocket(url)` once a device
 * gateway is available — the subscribe/unsubscribe contract stays the same.
 */
class RealtimeDeviceChannel {
  private listeners = new Set<Listener>();
  private interval: ReturnType<typeof setInterval> | null = null;

  subscribe(devices: Device[], listener: Listener): () => void {
    this.listeners.add(listener);
    if (!this.interval) {
      this.interval = setInterval(() => {
        if (devices.length === 0) return;
        const device = devices[Math.floor(Math.random() * devices.length)];
        const event: DeviceUpdateEvent = {
          deviceId: device.id,
          status: device.status,
          lastSeen: new Date().toISOString(),
        };
        this.listeners.forEach((l) => l(event));
      }, 15_000);
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    };
  }
}

export const realtimeDeviceChannel = new RealtimeDeviceChannel();
