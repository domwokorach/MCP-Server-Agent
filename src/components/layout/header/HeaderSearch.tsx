"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Search, X } from "lucide-react";

interface HeaderSearchProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export function HeaderSearch({
  placeholder = "Search devices, tasks, agents...",
  onSearch,
}: HeaderSearchProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus();
  }, [mobileOpen]);

  const handleChange = (next: string) => {
    setValue(next);
    onSearch?.(next);
  };

  return (
    <>
      <Box
        sx={{
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          gap: 1,
          height: 40,
          px: 1.5,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--header-border)",
          bgcolor: "var(--surface-soft)",
          width: { sm: 200, md: 260, lg: 340 },
          flexShrink: 0,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          "&:focus-within": {
            borderColor: "primary.main",
            boxShadow: "0 0 0 3px rgb(108 92 245 / 0.15)",
          },
        }}
      >
        <Search size={17} color="var(--header-muted)" style={{ flexShrink: 0 }} />
        <InputBase
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={placeholder}
          fullWidth
          inputProps={{ "aria-label": "Search" }}
          sx={{
            fontSize: "0.8125rem",
            color: "var(--header-title)",
            "& input::placeholder": { color: "var(--header-muted)", opacity: 1 },
          }}
        />
      </Box>

      <Tooltip title="Search">
        <IconButton
          aria-label="Open search"
          onClick={() => setMobileOpen(true)}
          sx={{ display: { xs: "inline-flex", sm: "none" }, width: 40, height: 40, flexShrink: 0 }}
        >
          <Search size={19} />
        </IconButton>
      </Tooltip>

      {mobileOpen && (
        <Box
          role="search"
          sx={{
            display: { xs: "flex", sm: "none" },
            position: "absolute",
            inset: 0,
            zIndex: 2,
            alignItems: "center",
            gap: 1,
            px: 2,
            bgcolor: "var(--header-bg)",
          }}
        >
          <Search size={18} color="var(--header-muted)" style={{ flexShrink: 0 }} />
          <InputBase
            inputRef={inputRef}
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={placeholder}
            fullWidth
            inputProps={{ "aria-label": "Search" }}
            sx={{ fontSize: "0.9375rem", color: "var(--header-title)" }}
          />
          <IconButton aria-label="Close search" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </IconButton>
        </Box>
      )}
    </>
  );
}
