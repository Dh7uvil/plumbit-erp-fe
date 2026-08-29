"use client";

import { Edit2 } from "lucide-react";

import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { UserStatusBadge } from "@/modules/users-management/users/components/user-status-badge";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useUser } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
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
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDate, formatDateTime, initials, titleCase } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  );
}

export function UserViewDialog({
  userId,
  onOpenChange,
  onEdit,
}: {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string) => void;
}) {
  const can = useCan();
  const detailQuery = useUser(userId);
  const user = detailQuery.data;

  return (
    <Dialog open={Boolean(userId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user?.name ?? "User details"}</DialogTitle>
          <DialogDescription className="sr-only">User account and employee details</DialogDescription>
        </DialogHeader>
        {detailQuery.isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="mx-auto size-16 rounded-full" />
            <Skeleton className="mx-auto h-4 w-40" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : null}
        {detailQuery.isError ? (
          <p className="text-destructive text-sm">{getErrorMessage(detailQuery.error)}</p>
        ) : null}
        {user ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 py-1">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary text-sm text-white">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold">{user.name}</p>
              <p className="text-muted-foreground text-sm">
                {user.employee?.designation ?? user.email}
              </p>
              <div className="flex flex-wrap justify-center gap-1">
                {user.roles.map((role) => (
                  <Badge key={role.id} variant="info">
                    {role.name}
                  </Badge>
                ))}
                <UserStatusBadge status={user.status} />
              </div>
            </div>
            <Separator />
            <div className="space-y-2.5">
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Phone" value={user.phone ?? "—"} />
              <InfoRow label="Employee code" value={user.employee?.employee_code ?? "—"} />
              <InfoRow label="Department" value={user.employee?.department?.name ?? "—"} />
              <InfoRow label="Branch" value={user.employee?.branch?.name ?? "—"} />
              <InfoRow label="Designation" value={user.employee?.designation ?? "—"} />
              <InfoRow
                label="Employee status"
                value={user.employee ? titleCase(user.employee.status) : "—"}
              />
              <InfoRow label="Joined" value={formatDate(user.employee?.joining_date)} />
              <InfoRow label="Last login" value={formatDateTime(user.last_login_at)} />
            </div>
            {user.employee ? (
              <EntityAttachmentsPanel entityType="EMPLOYEE" entityId={user.employee.id} />
            ) : null}
            {can(userPermissions.update) ? (
              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(user.id)}>
                  <Edit2 className="size-3.5" />
                  Edit
                </Button>
              </DialogFooter>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
