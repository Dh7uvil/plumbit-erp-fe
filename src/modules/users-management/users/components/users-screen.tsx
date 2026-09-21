"use client";

import { Ban, KeyRound, UserCheck, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DeactivateUserDialog } from "@/modules/users-management/users/components/deactivate-user-dialog";
import { ResetUserPasswordDialog } from "@/modules/users-management/users/components/reset-user-password-dialog";
import { UserFormDialog } from "@/modules/users-management/users/components/user-form-dialog";
import { UserStatusBadge } from "@/modules/users-management/users/components/user-status-badge";
import {
  UsersTableFilters,
  userListParamsFromTable,
} from "@/modules/users-management/users/components/users-table-filters";
import { UserViewDialog } from "@/modules/users-management/users/components/user-view-dialog";
import { useActivateUser } from "@/modules/users-management/users/mutations";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useUsers } from "@/modules/users-management/users/queries";
import type { User } from "@/modules/users-management/users/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { auditTimestampColumns } from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { formatDate, formatDateTime, initials } from "@/shared/lib/format";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

export function UsersScreen() {
  const can = useCan();
  const { canCreate, canRead, canUpdate } = useCrudPermissions(userPermissions);
  const activateUser = useActivateUser();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);
  const [resettingPassword, setResettingPassword] = useState<User | null>(null);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();

  const usersQuery = useUsers(
    userListParamsFromTable({
      page,
      page_size,
      search,
      sort_by,
      sort_order,
      filters,
    }),
  );

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
  const showActions = hasRowActions(canRead);

  async function onActivate(user: User) {
    try {
      await activateUser.mutateAsync(user.id);
      toast.success("User activated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<User>> => {
    return [
      {
        id: "email",
        header: "Email",
        sortableField: "email",
        className: "text-muted-foreground text-xs",
        cell: (user) => user.email,
      },
      {
        id: "user",
        header: "User",
        sortableField: "name",
        cell: (user) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{user.name}</p>
              {user.employee?.employee_code ? (
                <p className="text-muted-foreground text-xs">{user.employee.employee_code}</p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "department",
        header: "Department",
        cell: (user) => user.employee?.department?.name ?? "—",
      },
      {
        id: "designation",
        header: "Designation",
        cell: (user) => user.employee?.designation ?? "—",
      },
      {
        id: "role",
        header: "Role",
        cell: (user) =>
          user.roles.length === 0 ? (
            "—"
          ) : (
            <div className="flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <Badge key={role.id} variant="info">
                  {role.name}
                </Badge>
              ))}
            </div>
          ),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (user) => <UserStatusBadge status={user.status} />,
      },
      {
        id: "joining_date",
        header: "Joining date",
        className: "text-muted-foreground text-xs",
        cell: (user) => formatDate(user.employee?.joining_date),
      },
      {
        id: "phone",
        header: "Phone",
        defaultVisible: false,
        className: "text-muted-foreground text-xs",
        cell: (user) => user.phone || "—",
      },
      {
        id: "branch",
        header: "Branch",
        defaultVisible: false,
        cell: (user) => user.employee?.branch?.name ?? "—",
      },
      {
        id: "employee_code",
        header: "Employee code",
        defaultVisible: false,
        className: "font-mono text-xs",
        cell: (user) => user.employee?.employee_code ?? "—",
      },
      {
        id: "employee_status",
        header: "Employee status",
        defaultVisible: false,
        cell: (user) =>
          user.employee ? <ActiveBadge active={user.employee.status === "ACTIVE"} /> : "—",
      },
      {
        id: "last_login_at",
        header: "Last login",
        defaultVisible: false,
        className: "text-muted-foreground text-xs",
        cell: (user) => formatDateTime(user.last_login_at),
      },
      ...auditTimestampColumns<User>(),
      ...actionsColumn<User>(showActions, (user) => (
        <DataTableRowActions
          entityName={user.name}
          onView={canRead ? () => setViewingId(user.id) : undefined}
          onEdit={canUpdate ? () => openEdit(user.id) : undefined}
          extra={
            <>
              {canUpdate && user.status === "DISABLED" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`Activate ${user.name}`}
                  title={`Activate ${user.name}`}
                  disabled={activateUser.isPending && activateUser.variables === user.id}
                  onClick={() => void onActivate(user)}
                >
                  <UserCheck className="size-3.5" />
                </Button>
              ) : null}
              {canUpdate ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`Reset password for ${user.name}`}
                  title={`Reset password for ${user.name}`}
                  onClick={() => setResettingPassword(user)}
                >
                  <KeyRound className="size-3.5" />
                </Button>
              ) : null}
              {can(userPermissions.deactivate) && user.status !== "DISABLED" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive size-7"
                  aria-label={`Deactivate ${user.name}`}
                  title={`Deactivate ${user.name}`}
                  onClick={() => setDeactivating(user)}
                >
                  <Ban className="size-3.5" />
                </Button>
              ) : null}
            </>
          }
        />
      )),
    ];
  }, [
    activateUser.isPending,
    activateUser.variables,
    can,
    canRead,
    canUpdate,
    onActivate,
    showActions,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("identity.users", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Users"
        subtitle="Manage users and role assignment"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <UserPlus className="size-3.5" />
              New User
            </Button>
          ) : undefined
        }
      />
      <UsersTableFilters columnsDialog={columnsDialog} />
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads
              columns={columns}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : usersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(usersQuery.error)}
                  onRetry={() => usersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No users found"
                  message="Try a different search or filter."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((user) => (
              <TableRow key={user.id}>
                <DataTableCells columns={columns} row={user} />
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
      <ResetUserPasswordDialog
        user={resettingPassword}
        onOpenChange={(open) => {
          if (!open) {
            setResettingPassword(null);
          }
        }}
      />
    </ListPage>
  );
}
