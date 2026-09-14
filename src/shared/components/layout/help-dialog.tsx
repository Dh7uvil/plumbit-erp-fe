"use client";

import { HelpCircle } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const SHORTCUTS = [
  { keys: "⌘K / Ctrl+K", action: "Open page search" },
  { keys: "Esc", action: "Close search and dialogs" },
  { keys: "↑ ↓ Enter", action: "Move and open a search result" },
] as const;

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            Keyboard shortcuts for moving around the app. Ask your administrator for account or
            permission changes.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.action} className="flex items-center justify-between gap-3 text-sm">
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
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hidden md:inline-flex"
      onClick={onClick}
      aria-label="Help and support"
      title="Help & Support"
    >
      <HelpCircle className="size-3.5" />
    </Button>
  );
}
