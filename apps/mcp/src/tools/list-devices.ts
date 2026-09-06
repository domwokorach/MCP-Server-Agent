import { listDevicesInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

export const listDevicesTool: ToolDefinition<typeof listDevicesInputSchema.shape> = {
  name: "list_devices",
  description: "List connected mobile, desktop, and laptop devices, optionally filtered by type.",
  inputSchema: listDevicesInputSchema,
  requiredRole: "user",
  handler: async ({ type }) => {
    const devices = await platformService.listDevices();
    return type ? devices.filter((device) => device.type === type) : devices;
  },
};
