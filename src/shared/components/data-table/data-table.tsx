import type { ReactNode } from "react";

import { DataTablePanel } from "@/shared/components/data-table/data-table-panel";
import { ListPageTable } from "@/shared/components/layout/list-page";
import { Card } from "@/shared/components/ui/card";
import { Table } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/cn";

export const LIST_TABLE_SCROLL_CLASS = "list-table-scroll min-h-0 flex-1";
export { LIST_TABLE_PANEL_CLASS } from "./data-table-panel";

function DataTableFooter({ footer }: { footer: ReactNode }) {
  return (
    <div className="bg-card shrink-0 rounded-b-md border border-t empty:hidden">{footer}</div>
  );
}

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
    <Table
      className={cn("min-w-full", tableClassName)}
      containerClassName={LIST_TABLE_SCROLL_CLASS}
    >
      {children}
    </Table>
  );

  if (variant === "embedded") {
    return (
      <DataTablePanel className={cn("w-full", className)}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
          {table}
        </div>
        {footer ? <DataTableFooter footer={footer} /> : null}
      </DataTablePanel>
    );
  }

  return (
    <ListPageTable>
      <DataTablePanel>
        <Card
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0 [&_[data-slot=table-container]]:min-h-0 [&_[data-slot=table-container]]:flex-1",
            footer ? "rounded-b-none border-b-0" : undefined,
            className,
          )}
        >
          {table}
        </Card>
        {footer ? <DataTableFooter footer={footer} /> : null}
      </DataTablePanel>
    </ListPageTable>
  );
}
