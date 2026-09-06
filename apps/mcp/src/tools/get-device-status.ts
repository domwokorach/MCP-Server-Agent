import { deviceIdInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

export const getDeviceStatusTool: ToolDefinition<typeof deviceIdInputSchema.shape> = {
  name: "get_device_status",
  description: "Get a device's current status.",
  inputSchema: deviceIdInputSchema,
  requiredRole: "user",
  handler: async ({ deviceId }) => {
    const device = await platformService.getDevice(deviceId);
    if (!device) throw new Error("Device not found.");
    return device;
  },
};
