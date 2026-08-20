"use client";

import { Ban, Edit2, Eye, UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { DeactivateUserDialog } from "@/modules/users-management/users/components/deactivate-user-dialog";
import { UserFormDialog } from "@/modules/users-management/users/components/user-form-dialog";
import { UserStatusBadge } from "@/modules/users-management/users/components/user-status-badge";
import {
  UsersTableFilters,
  type UserListFilterParams,
} from "@/modules/users-management/users/components/users-table-filters";
import { UserViewDialog } from "@/modules/users-management/users/components/user-view-dialog";
import { useActivateUser } from "@/modules/users-management/users/mutations";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useUsers } from "@/modules/users-management/users/queries";
import type { User } from "@/modules/users-management/users/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, initials } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const TABLE_HEADERS = [
  "User",
  "Email",
  "Department",
  "Designation",
  "Role",
  "Status",
  "Joining date",
  "Actions",
] as const;

export function UsersScreen() {
  const can = useCan();
  const activateUser = useActivateUser();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<UserListFilterParams>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);

  const usersQuery = useUsers({
    page,
    page_size: DEFAULT_PAGE_SIZE,
    ...filters,
  });

  function handleFiltersChange(next: UserListFilterParams) {
    setFilters(next);
    setPage(1);
  }

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    setViewingId(null);
    setEditingId(id);
    setFormOpen(true);
  }

  const rows = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;

  async function onActivate(user: User) {
    try {
      await activateUser.mutateAsync(user.id);
      toast.success("User activated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Users"
        subtitle="Manage users and role assignment"
        actions={
          can(userPermissions.create) ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <UserPlus className="size-3.5" />
              New User
            </Button>
          ) : undefined
        }
      />
      <UsersTableFilters onChange={handleFiltersChange} />
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {TABLE_HEADERS.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={TABLE_HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : usersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={TABLE_HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(usersQuery.error)}
                  onRetry={() => usersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={TABLE_HEADERS.length}>
                <DataTableEmpty
                  title="No users found"
                  message="Try a different search or filter."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px]">{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{user.email}</TableCell>
                <TableCell>{user.employee?.department?.name ?? "—"}</TableCell>
                <TableCell>{user.employee?.designation ?? "—"}</TableCell>
                <TableCell>
                  {user.roles.length === 0 ? (
                    "—"
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant="info">
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(user.employee?.joining_date)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`View ${user.name}`}
                      onClick={() => setViewingId(user.id)}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    {can(userPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${user.name}`}
                        onClick={() => openEdit(user.id)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    ) : null}
                    {can(userPermissions.update) && user.status === "DISABLED" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Activate ${user.name}`}
                        disabled={activateUser.isPending && activateUser.variables === user.id}
                        onClick={() => void onActivate(user)}
                      >
                        <UserCheck className="size-3.5" />
                      </Button>
                    ) : null}
                    {can(userPermissions.deactivate) && user.status !== "DISABLED" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Deactivate ${user.name}`}
                        onClick={() => setDeactivating(user)}
                      >
                        <Ban className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <UserFormDialog
        open={formOpen}
        userId={editingId}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingId(null);
          }
        }}
      />
      <UserViewDialog
        userId={viewingId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingId(null);
          }
        }}
        onEdit={openEdit}
      />
      <DeactivateUserDialog
        user={deactivating}
        onOpenChange={(open) => {
          if (!open) {
            setDeactivating(null);
          }
        }}
      />
    </div>
  );
}
