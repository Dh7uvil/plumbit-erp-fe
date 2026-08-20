"use client";

import { Edit2, Loader2, Plus, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { RoleFormDialog } from "@/modules/users-management/roles/components/role-form-dialog";
import { useDeleteRole } from "@/modules/users-management/roles/mutations";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { useAllRoles } from "@/modules/users-management/roles/queries";
import type { Role } from "@/modules/users-management/roles/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
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
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const TABLE_HEADERS = ["Role", "Description", "Type", "Users", "Created", "Actions"] as const;

export function RolesScreen() {
  const can = useCan();
  const rolesQuery = useAllRoles();
  const deleteRole = useDeleteRole();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const roles = rolesQuery.data ?? [];

  function openCreate() {
    setEditing(null);
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
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Roles"
        subtitle="Define access roles for your organisation"
        actions={
          can(rolePermissions.create) ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Role
            </Button>
          ) : undefined
        }
      />
      <DataTable>
        <TableHeader>
          <TableRow>
            {TABLE_HEADERS.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rolesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={TABLE_HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : rolesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={TABLE_HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(rolesQuery.error)}
                  onRetry={() => rolesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={TABLE_HEADERS.length}>
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
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(rolePermissions.assignPermissions) || can(rolePermissions.update) ? (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/permissions?role_id=${role.id}`}>Edit Permissions</Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/permissions?role_id=${role.id}`}>View Permissions</Link>
                      </Button>
                    )}
                    {can(rolePermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${role.name}`}
                        onClick={() => {
                          setEditing(role);
                          setFormOpen(true);
                        }}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    ) : null}
                    {can(rolePermissions.delete) && !role.is_system_role ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${role.name}`}
                        onClick={() => setDeleting(role)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <RoleFormDialog
        open={formOpen}
        role={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
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
    </div>
  );
}
