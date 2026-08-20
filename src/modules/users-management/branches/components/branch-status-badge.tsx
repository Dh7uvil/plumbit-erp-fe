import { Badge } from "@/shared/components/ui/badge";
import { titleCase } from "@/shared/lib/format";
import type { BranchStatus } from "@/modules/users-management/branches/schemas";

const STATUS_VARIANT: Record<BranchStatus, "success" | "destructive"> = {
  ACTIVE: "success",
  INACTIVE: "destructive",
};

export function BranchStatusBadge({ status }: { status: BranchStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{titleCase(status)}</Badge>;
}
