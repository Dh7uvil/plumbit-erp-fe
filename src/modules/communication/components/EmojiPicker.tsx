"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Smile } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/cn";

type EmojiSelection = {
  native?: string;
};

export type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
};

export function EmojiPicker({ onSelect, disabled = false, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Insert emoji"
          disabled={disabled}
          className={className}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-auto border-0 p-0 shadow-lg", className)}>
        <Picker
          data={data}
          theme="auto"
          previewPosition="none"
          skinTonePosition="search"
          onEmojiSelect={(emoji: EmojiSelection) => {
            if (emoji.native) {
              onSelect(emoji.native);
            }
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
