import { Badge } from "@/shared/components/ui/badge";
import { titleCase } from "@/shared/lib/format";
import type { UserStatus } from "@/modules/users-management/users/schemas";

const STATUS_VARIANT: Record<UserStatus, "success" | "warning" | "destructive"> = {
  ACTIVE: "success",
  INVITED: "warning",
  DISABLED: "destructive",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{titleCase(status)}</Badge>;
}
