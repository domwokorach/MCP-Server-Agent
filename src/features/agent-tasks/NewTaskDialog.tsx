"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Device } from "@/types";

const schema = z.object({
  deviceId: z.string().min(1, "Choose a device."),
  instruction: z.string().min(4, "Describe the task in a bit more detail."),
});
type Values = z.infer<typeof schema>;

export function NewTaskDialog({ devices }: { devices: Device[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: Values) => {
    const device = devices.find((d) => d.id === values.deviceId);
    if (!device) return;
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-mcp-csrf": "1" },
      body: JSON.stringify({ deviceId: device.id, deviceName: device.name, instruction: values.instruction }),
    });
    if (!response.ok) throw new Error("Unable to create the task.");
    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button size="lg" className="h-10 rounded-xl px-4" onClick={() => setOpen(true)}><Plus size={18} />Create Task</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send an agent task</DialogTitle>
            <DialogDescription>Choose a paired device and describe the approved task.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label>Device</Label>
              <Controller
                control={control}
                name="deviceId"
                defaultValue=""
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select a device" /></SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.deviceId && <p className="text-xs text-destructive">{errors.deviceId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-instruction">Instruction</Label>
              <Textarea id="task-instruction" rows={3} aria-invalid={!!errors.instruction} {...register("instruction")} />
              {errors.instruction && <p className="text-xs text-destructive">{errors.instruction.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send task"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
