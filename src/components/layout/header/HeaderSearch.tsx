"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
      <div className="hidden h-9 w-50 shrink-0 items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 transition focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20 sm:flex md:w-65 lg:w-85">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className="h-8 border-0 bg-transparent px-0 shadow-none ring-0 focus-visible:ring-0"
        />
      </div>

      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon" className="shrink-0 sm:hidden" aria-label="Open search" onClick={() => setMobileOpen(true)} />}>
          <Search size={19} />
        </TooltipTrigger>
        <TooltipContent>Search</TooltipContent>
      </Tooltip>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="top-4 -translate-y-0 rounded-2xl p-4 sm:hidden" showCloseButton={false}>
          <div className="flex items-center gap-2" role="search">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={value}
              onChange={(event) => handleChange(event.target.value)}
              placeholder={placeholder}
              aria-label="Search"
              className="border-0 bg-transparent px-0 text-base shadow-none ring-0 focus-visible:ring-0"
            />
            <Button variant="ghost" size="icon" aria-label="Close search" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
