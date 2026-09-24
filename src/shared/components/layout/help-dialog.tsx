"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";

import { docsForAppRoute } from "@/config/docs-catalog";
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
  const pathname = usePathname();
  const contextualDocs = docsForAppRoute(pathname).slice(0, 3);

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
        <div className="flex flex-col gap-3">
          <Link
            href="/docs"
            onClick={() => onOpenChange(false)}
            className="bg-primary/5 text-primary hover:bg-primary/10 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            Open documentation
          </Link>
          {contextualDocs.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-xs font-medium uppercase">Help for this page</p>
              {contextualDocs.map((doc) => (
                <Link
                  key={doc.path}
                  href={doc.path}
                  onClick={() => onOpenChange(false)}
                  className="hover:bg-muted/60 rounded-md px-2 py-1.5 text-sm transition-colors"
                >
                  {doc.title}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
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
