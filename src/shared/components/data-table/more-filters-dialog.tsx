"use client";

import { ListFilter } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";

export function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function MoreFiltersDialog({
  extraCount,
  draftCount,
  description,
  title = "More filters",
  contentClassName = "sm:max-w-lg",
  children,
  onOpen,
  onApply,
  onClearDraft,
}: {
  extraCount: number;
  draftCount: number;
  description: string;
  title?: string;
  contentClassName?: string;
  children: ReactNode;
  onOpen: () => void;
  onApply: () => void;
  onClearDraft: () => void;
}) {
  const [open, setOpen] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) {
      onOpen();
    }
    setOpen(next);
  }

  function apply() {
    onApply();
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <ListFilter className="size-3.5" />
        More filters
        {extraCount > 0 ? (
          <Badge variant="secondary" className="h-5 min-w-5 px-1">
            {extraCount}
          </Badge>
        ) : null}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={contentClassName}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
          <DialogFooter className="gap-2 sm:justify-between">
            {draftCount > 0 ? (
              <Button type="button" variant="ghost" onClick={onClearDraft}>
                Clear extra
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={apply}>
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
