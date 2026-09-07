"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}

export function PinInput({ length = 6, value, onChange, disabled, invalid, autoFocus }: PinInputProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = React.useMemo(() => {
    const chars = value.split("").slice(0, length);
    return Array.from({ length }, (_, i) => chars[i] ?? "");
  }, [value, length]);

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));
  };

  const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(index, "");
      return;
    }
    // Handles both single keystrokes and multi-character autofill landing in one box.
    const chars = raw.split("");
    const next = digits.slice();
    let cursor = index;
    for (const char of chars) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }
    onChange(next.join(""));
    const focusIndex = Math.min(cursor, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste}
          aria-invalid={invalid}
          className={cn(
            "h-12 w-10 rounded-xl border border-transparent bg-input/50 text-center text-lg font-semibold tabular-nums outline-none transition-[color,box-shadow,background-color] sm:h-14 sm:w-12 sm:text-xl",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
            invalid && "border-destructive ring-3 ring-destructive/20",
            disabled && "pointer-events-none opacity-50"
          )}
        />
      ))}
    </div>
  );
}
