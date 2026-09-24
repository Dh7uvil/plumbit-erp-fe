"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, ListTree } from "lucide-react";

import { DocsSidebar } from "@/modules/documentation/components/docs-sidebar";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";

export function DocsMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shadow-xs">
          <ListTree className="size-4" />
          Topics
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,20rem)] gap-0 p-0">
        <SheetHeader className="border-border border-b px-4 py-4 text-start">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <BookOpen className="size-4" />
            </span>
            <SheetTitle className="text-base">Documentation</SheetTitle>
          </div>
        </SheetHeader>
        <div className="overflow-y-auto p-4">
          <DocsSidebar className="max-h-[calc(100vh-7rem)]" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
