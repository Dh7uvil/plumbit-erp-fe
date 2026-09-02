"use client";

import { Loader2, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { RoleFormDialog } from "@/modules/users-management/roles/components/role-form-dialog";
import { useDeleteRole } from "@/modules/users-management/roles/mutations";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { useRoles } from "@/modules/users-management/roles/queries";
import type { Role } from "@/modules/users-management/roles/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDate } from "@/shared/lib/format";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const COLUMN_HEADERS = ["Role", "Description", "Type", "Users", "Created"] as const;
const SORT_FIELDS = [
  { value: "name", label: "Role" },
  { value: "created_at", label: "Created" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Role: "name",
  Created: "created_at",
};

export function RolesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(rolePermissions);
  const can = useCan();
  const canAssign = can(rolePermissions.assignPermissions);
  const { page, page_size, search, sort_by, sort_order, setParams, setPage } = useTableParams();
  const rolesQuery = useRoles({ page, page_size, search, sort_by, sort_order });
  const deleteRole = useDeleteRole();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Role | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete, true);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const roles = rolesQuery.data?.data ?? [];
  const meta = rolesQuery.data?.meta;

  function openCreate() {
    setSelected(null);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  function openView(role: Role) {
    setSelected(role);
    setForceReadOnly(true);
    setFormOpen(true);
  }

  function openEdit(role: Role) {
    setSelected(role);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteRole.mutateAsync(deleting.id);
      toast.success("Role deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Roles"
        subtitle="Define access roles for your organisation"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Role
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search roles…"
        />
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {search || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setParams({ search: null, sort_by: null, sort_order: null })}
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <SortableHeads
              headers={headers}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rolesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : rolesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(rolesQuery.error)}
                  onRetry={() => rolesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty title="No roles" message="No roles are available yet." />
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 flex size-7 items-center justify-center rounded-lg">
                      <Shield className="text-primary size-3.5" />
                    </div>
                    <span className="font-medium">{role.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate text-xs whitespace-normal">
                  {role.description || "—"}
                </TableCell>
                <TableCell>
                  {role.is_system_role ? (
                    <Badge variant="secondary">System</Badge>
                  ) : (
                    <Badge variant="outline">Custom</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="info">{role.user_count}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(role.created_at)}
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={role.name}
                      onView={canRead ? () => openView(role) : undefined}
                      onEdit={canUpdate ? () => openEdit(role) : undefined}
                      onDelete={
                        canDelete && !role.is_system_role ? () => setDeleting(role) : undefined
                      }
                      extra={
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/permissions?role_id=${role.id}`}>
                            {canAssign || canUpdate ? "Edit Permissions" : "View Permissions"}
                          </Link>
                        </Button>
                      }
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <RoleFormDialog
        open={formOpen}
        role={selected}
        forceReadOnly={forceReadOnly}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelected(null);
            setForceReadOnly(false);
          }
        }}
      />
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleting ? `"${deleting.name}"` : "this role"}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRole.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteRole.isPending}
              onClick={confirmDelete}
            >
              {deleteRole.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ListPage>
  );
}
