import { listDevices } from "@/services/deviceService";
import { DeviceConsole } from "./DeviceConsole";

export async function DevicesList() {
  return <DeviceConsole initialDevices={await listDevices()} />;
}
