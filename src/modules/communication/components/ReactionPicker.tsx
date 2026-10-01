"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { SmilePlus } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { commTheme } from "@/modules/communication/components/ui/comm-theme";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

type EmojiSelection = {
  native?: string;
};

export type MessageReaction = {
  emoji: string;
  userIds: string[];
};

export type ReactionPickerProps = {
  reactions?: MessageReaction[];
  currentUserId?: string | null;
  onToggleReaction: (emoji: string) => void;
  disabled?: boolean;
  align?: "start" | "end";
  showAddButton?: boolean;
  /** Extra controls shown beside the add-reaction button (e.g. message menu). */
  suffix?: ReactNode;
  onPickerOpenChange?: (open: boolean) => void;
  /** Keep action buttons visible while a menu/popover is open. */
  forceShowActions?: boolean;
  className?: string;
};

export function ReactionPicker({
  reactions = [],
  currentUserId,
  onToggleReaction,
  disabled = false,
  align = "start",
  showAddButton = true,
  suffix,
  onPickerOpenChange,
  forceShowActions = false,
  className,
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const grouped = useMemo(
    () =>
      reactions.map((reaction) => ({
        ...reaction,
        reactedByMe: currentUserId ? reaction.userIds.includes(currentUserId) : false,
      })),
    [currentUserId, reactions],
  );

  const hasReactions = grouped.length > 0;
  const hasActionControls = showAddButton || Boolean(suffix);

  if (!hasReactions && !hasActionControls) {
    return null;
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onPickerOpenChange?.(next);
  };

  const actionVisibility = cn(
    "flex items-center gap-0.5 transition-opacity",
    forceShowActions
      ? "pointer-events-auto opacity-100"
      : "pointer-events-none opacity-0 group-hover/message:pointer-events-auto group-hover/message:opacity-100",
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
    >
      {grouped.map((reaction) => (
        <Tooltip key={reaction.emoji}>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggleReaction(reaction.emoji)}
              className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full border px-1.5 text-xs shadow-sm transition-colors",
                "disabled:pointer-events-none disabled:opacity-50",
                reaction.reactedByMe ? commTheme.reactionMine : commTheme.reactionOther,
              )}
              aria-label={`${reaction.emoji} reaction, ${reaction.userIds.length} ${reaction.userIds.length === 1 ? "person" : "people"}`}
            >
              <span className="text-[15px] leading-none">{reaction.emoji}</span>
              {reaction.userIds.length > 1 ? (
                <span className="text-[10px] font-medium tabular-nums">{reaction.userIds.length}</span>
              ) : null}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {reaction.userIds.length}{" "}
            {reaction.userIds.length === 1 ? "person reacted" : "people reacted"}
          </TooltipContent>
        </Tooltip>
      ))}

      {hasActionControls ? (
        <div className={actionVisibility}>
          {showAddButton ? (
            <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Add reaction"
                  aria-expanded={open}
                  disabled={disabled}
                  className="h-6 w-6 rounded-full border border-dashed border-border/70 text-muted-foreground hover:bg-white hover:text-foreground"
                >
                  <SmilePlus className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align={align === "end" ? "end" : "start"}
                className="w-auto border-0 p-0 shadow-lg"
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                <Picker
                  data={data}
                  theme="auto"
                  previewPosition="none"
                  skinTonePosition="search"
                  onEmojiSelect={(emoji: EmojiSelection) => {
                    if (emoji.native) {
                      onToggleReaction(emoji.native);
                    }
                    handleOpenChange(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          ) : null}
          {suffix}
        </div>
      ) : null}
    </div>
  );
}
