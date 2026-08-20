import type { ReactNode } from "react";

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
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <Table>{children}</Table>
      {footer}
    </Card>
  );
}
