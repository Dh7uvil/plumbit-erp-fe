"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  grantedPermissionIds,
  permissionMatrixTable,
} from "@/modules/users-management/permissions/matrix";
import { usePermissionMatrix } from "@/modules/users-management/permissions/queries";
import {
  useResetRolePermissions,
  useSetRolePermissions,
} from "@/modules/users-management/roles/mutations";
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
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { titleCase } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function isSystemAdminRole(role: Pick<Role, "name" | "is_system_role"> | undefined) {
  return role?.is_system_role === true && role.name.toLowerCase() === "admin";
}

export function PermissionsScreen() {
  const can = useCan();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleIdParam = searchParams.get("role_id");
  const rolesQuery = useAllRoles();
  const selectedRoleId = roleIdParam ?? rolesQuery.data?.[0]?.id ?? null;
  const matrixQuery = usePermissionMatrix(selectedRoleId);
  const savePermissions = useSetRolePermissions();
  const resetPermissions = useResetRolePermissions();
  const [draft, setDraft] = useState<{ roleId: string; ids: string[] } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const canSave = can(rolePermissions.assignPermissions) || can(rolePermissions.update);
  const selectedRole = rolesQuery.data?.find((role) => role.id === selectedRoleId) ?? null;
  const canResetAdmin = canSave && isSystemAdminRole(selectedRole ?? undefined);
  const pending = savePermissions.isPending || resetPermissions.isPending;

  const selectedIds = useMemo(() => {
    if (draft && draft.roleId === selectedRoleId) {
      return new Set(draft.ids);
    }
    if (!matrixQuery.data) {
      return new Set<string>();
    }
    return new Set(grantedPermissionIds(matrixQuery.data));
  }, [draft, selectedRoleId, matrixQuery.data]);

  const table = useMemo(
    () => (matrixQuery.data ? permissionMatrixTable(matrixQuery.data) : { actions: [], rows: [] }),
    [matrixQuery.data],
  );

  function toggle(id: string, checked: boolean) {
    if (!selectedRoleId) {
      return;
    }
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setDraft({ roleId: selectedRoleId, ids: [...next] });
  }

  function selectRole(id: string) {
    setDraft(null);
    router.replace(`/permissions?role_id=${id}`);
  }

  async function onSave() {
    if (!selectedRoleId) {
      return;
    }
    try {
      await savePermissions.mutateAsync({
        id: selectedRoleId,
        permissionIds: [...selectedIds],
      });
      setDraft(null);
      toast.success("Permissions saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onReset() {
    if (!selectedRoleId) {
      return;
    }
    try {
      await resetPermissions.mutateAsync(selectedRoleId);
      setDraft(null);
      setResetOpen(false);
      toast.success("Admin permissions reset");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const roles = rolesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Permissions"
        subtitle="Assign catalog permissions to a role"
        actions={
          canSave ? (
            <div className="flex gap-2">
              {canResetAdmin ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResetOpen(true)}
                  disabled={!selectedRoleId || pending}
                >
                  Reset to Default
                </Button>
              ) : null}
              <Button type="button" size="sm" onClick={onSave} disabled={!selectedRoleId || pending}>
                {savePermissions.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Permissions
              </Button>
            </div>
          ) : undefined
        }
      />
      <div className="flex items-center gap-3">
        <label className="text-muted-foreground text-sm font-medium">Role</label>
        <Select
          value={selectedRoleId ?? undefined}
          onValueChange={selectRole}
          disabled={rolesQuery.isLoading || roles.length === 0}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {rolesQuery.isError || matrixQuery.isError ? (
        <DataTableError
          message={getErrorMessage(rolesQuery.error ?? matrixQuery.error)}
          onRetry={() => {
            void rolesQuery.refetch();
            void matrixQuery.refetch();
          }}
        />
      ) : null}
      {rolesQuery.isLoading || matrixQuery.isLoading ? <Skeleton className="h-64 w-full" /> : null}
      {!rolesQuery.isLoading && roles.length === 0 ? (
        <DataTableEmpty title="No roles" message="Create a role before assigning permissions." />
      ) : null}
      {!matrixQuery.isLoading && table.rows.length === 0 && roles.length > 0 ? (
        <DataTableEmpty title="No permissions" message="The permission catalog is empty." />
      ) : null}
      {!matrixQuery.isLoading && table.rows.length > 0 && selectedRoleId ? (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Module</TableHead>
              <TableHead>Resource</TableHead>
              {table.actions.map((action) => (
                <TableHead key={action} className="text-center">
                  {titleCase(action)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row) => (
              <TableRow key={`${row.module}-${row.resource}`}>
                <TableCell className="font-medium">{row.module}</TableCell>
                <TableCell>{row.resource}</TableCell>
                {table.actions.map((action) => {
                  const permission = row.actions[action];
                  if (!permission) {
                    return <TableCell key={action} />;
                  }
                  return (
                    <TableCell key={action} className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={selectedIds.has(permission.id)}
                          disabled={!canSave}
                          onCheckedChange={(value) => toggle(permission.id, Boolean(value))}
                          aria-label={`${row.module} ${row.resource} ${action}`}
                        />
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
          {canSave ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2 + table.actions.length} className="text-right">
                  <div className="flex justify-end gap-2">
                    {canResetAdmin ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setResetOpen(true)}
                        disabled={pending}
                      >
                        Reset to Default
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" onClick={onSave} disabled={pending}>
                      {savePermissions.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Save Permissions
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          ) : null}
        </DataTable>
      ) : null}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Admin permissions</AlertDialogTitle>
            <AlertDialogDescription>
              Restore the system Admin role to the full seeded permission catalog? Unsaved changes
              on this screen will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetPermissions.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={resetPermissions.isPending}
              onClick={() => void onReset()}
            >
              {resetPermissions.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Reset to Default
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
