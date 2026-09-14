"use client";

import { HelpCircle } from "lucide-react";

import { KEYBOARD_SHORTCUTS } from "@/shared/lib/keyboard-shortcuts";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            Keyboard shortcuts work across the app. Single-letter shortcuts are ignored while you
            are typing in a field. Ask your administrator for account or permission changes.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <li key={shortcut.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground">{shortcut.action}</span>
              <kbd className="bg-muted text-muted-foreground border-border rounded border px-1.5 py-0.5 font-mono text-[11px]">
                {shortcut.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function HelpTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hidden md:inline-flex"
          onClick={onClick}
          aria-label="Help"
        >
          <HelpCircle className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Help</TooltipContent>
    </Tooltip>
  );
}
