"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAgentTask } from "@/services/agentTaskService";
import { sendTaskSchema, type SendTaskValues } from "./schemas";

interface SendTaskFormProps {
  deviceId: string;
  deviceName: string;
}

export function SendTaskForm({ deviceId, deviceName }: SendTaskFormProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SendTaskValues>({
    resolver: zodResolver(sendTaskSchema),
  });

  const onSubmit = async (values: SendTaskValues) => {
    setSuccess(null);
    const task = await createAgentTask({ deviceId, deviceName, instruction: values.instruction });
    setSuccess(`Task queued (${task.id}).`);
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {success && <Alert className="border-success/30 bg-success/10 text-success"><AlertDescription className="text-success">{success}</AlertDescription></Alert>}
      <div className="space-y-2">
        <Label htmlFor="instruction">Instruction</Label>
        <Textarea id="instruction" placeholder="e.g. Turn off at midnight every night" rows={3} aria-invalid={!!errors.instruction} {...register("instruction")} />
        {errors.instruction && <p className="text-xs text-destructive">{errors.instruction.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send task"}</Button>
    </form>
  );
}
