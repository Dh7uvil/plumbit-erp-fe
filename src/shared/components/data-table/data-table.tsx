import type { ReactNode } from "react";

import { ListPageTable } from "@/shared/components/layout/list-page";
import { Card } from "@/shared/components/ui/card";
import { Table } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/cn";

export function DataTable({
  children,
  footer,
  className,
  tableClassName,
  variant = "page",
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  tableClassName?: string;
  variant?: "page" | "embedded";
}) {
  const table = (
    <>
      <Table className={cn("min-w-full", tableClassName)} containerClassName="overflow-auto">
        {children}
      </Table>
      {footer ? <div className="bg-card shrink-0 border-t empty:hidden">{footer}</div> : null}
    </>
  );

  if (variant === "embedded") {
    return (
      <div
        className={cn("flex min-h-0 w-full flex-col overflow-hidden rounded-md border", className)}
      >
        {table}
      </div>
    );
  }

  return (
    <ListPageTable>
      <Card className={cn("flex h-fit max-h-full min-h-0 w-full flex-col gap-0 py-0", className)}>
        {table}
      </Card>
    </ListPageTable>
  );
}
