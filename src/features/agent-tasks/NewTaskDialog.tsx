"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { Plus } from "lucide-react";

import { createAgentTask } from "@/services/agentTaskService";
import type { Device } from "@/types";

const schema = z.object({
  deviceId: z.string().min(1, "Choose a device."),
  instruction: z.string().min(4, "Describe the task in a bit more detail."),
});
type Values = z.infer<typeof schema>;

export function NewTaskDialog({ devices }: { devices: Device[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    const device = devices.find((d) => d.id === values.deviceId);
    if (!device) return;
    await createAgentTask({ deviceId: device.id, deviceName: device.name, instruction: values.instruction });
    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Plus size={18} />}
        onClick={() => setOpen(true)}
        sx={{ height: { sm: 40, md: 44 }, borderRadius: "var(--radius-md)", px: 2.25, boxShadow: "none", whiteSpace: "nowrap", "&:hover": { boxShadow: "none" } }}
      >
        Create Task
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Send an agent task</DialogTitle>
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <Stack spacing={2.5}>
              <Controller
                control={control}
                name="deviceId"
                defaultValue=""
                render={({ field }) => (
                  <TextField {...field} select label="Device" error={!!errors.deviceId} helperText={errors.deviceId?.message} fullWidth>
                    {devices.map((device) => (
                      <MenuItem key={device.id} value={device.id}>
                        {device.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label="Instruction"
                multiline
                minRows={2}
                fullWidth
                {...register("instruction")}
                error={!!errors.instruction}
                helperText={errors.instruction?.message}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send task"}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </>
  );
}
