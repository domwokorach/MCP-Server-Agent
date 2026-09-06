import { z } from "zod";

export const sendTaskSchema = z.object({
  instruction: z.string().min(4, "Describe the task in a bit more detail."),
});
export type SendTaskValues = z.infer<typeof sendTaskSchema>;
