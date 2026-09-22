"use client";

import { Search } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";

export function CommandSearchTrigger({
  onOpen,
  collapsed = false,
  className,
}: {
  onOpen: () => void;
  collapsed?: boolean;
  className?: string;
}) {
  if (collapsed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn("text-muted-foreground", className)}
        onClick={onOpen}
        aria-label="Search pages"
      >
        <Search className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "text-muted-foreground bg-muted/40 h-7 justify-start gap-2 px-2.5 text-xs",
        className,
      )}
      onClick={onOpen}
    >
      <Search className="size-3 shrink-0" />
      Search…
      <kbd className="bg-background border-border ml-auto rounded border px-1 text-xs">⌘K</kbd>
    </Button>
  );
}
