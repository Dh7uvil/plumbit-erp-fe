import type { ReactNode } from "react";

import { ListPageTable } from "@/shared/components/layout/list-page";
import { Card } from "@/shared/components/ui/card";
import { Table } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/cn";

export function DataTable({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <ListPageTable>
      <Card className={cn("flex h-fit max-h-full min-h-0 w-full flex-col gap-0 py-0", className)}>
        <Table containerClassName="overflow-auto">{children}</Table>
        {footer ? <div className="bg-card shrink-0 border-t">{footer}</div> : null}
      </Card>
    </ListPageTable>
  );
}
