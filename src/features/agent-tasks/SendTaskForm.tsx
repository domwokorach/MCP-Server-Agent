"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

import { createAgentTask } from "@/services/agentTaskService";
import { sendTaskSchema, type SendTaskValues } from "./schemas";

interface SendTaskFormProps {
  deviceId: string;
  deviceName: string;
}

export function SendTaskForm({ deviceId, deviceName }: SendTaskFormProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendTaskValues>({ resolver: zodResolver(sendTaskSchema) });

  const onSubmit = async (values: SendTaskValues) => {
    setSuccess(null);
    const task = await createAgentTask({ deviceId, deviceName, instruction: values.instruction });
    setSuccess(`Task queued (${task.id}).`);
    reset();
  };

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
      {success && <Alert severity="success">{success}</Alert>}
      <TextField
        label="Instruction"
        placeholder="e.g. Turn off at midnight every night"
        multiline
        minRows={2}
        fullWidth
        {...register("instruction")}
        error={!!errors.instruction}
        helperText={errors.instruction?.message}
      />
      <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: "flex-start" }}>
        {isSubmitting ? "Sending…" : "Send task"}
      </Button>
    </Stack>
  );
}
