"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

type PasswordInputProps = React.ComponentProps<"input">;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, ...props },
  ref
) {
  const [visible, setVisible] = React.useState(false);

  return (
    <InputGroup className={className}>
      <InputGroupInput ref={ref} type={visible ? "text" : "password"} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label={visible ? "Hide password" : "Show password"}
          size="icon-sm"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
});
