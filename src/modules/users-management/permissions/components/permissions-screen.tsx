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
import {
  isResettableSystemRole,
  rolePermissions,
} from "@/modules/users-management/roles/permissions";
import { useAllRoles } from "@/modules/users-management/roles/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
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

const ALL = "all";

export function PermissionsScreen() {
  const can = useCan();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleIdParam = searchParams.get("role_id");
  const moduleFilter = searchParams.get("module") ?? ALL;
  const resourceFilter = searchParams.get("resource") ?? ALL;
  const rolesQuery = useAllRoles();
  const selectedRoleId = roleIdParam ?? rolesQuery.data?.[0]?.id ?? null;
  const matrixQuery = usePermissionMatrix(selectedRoleId);
  const savePermissions = useSetRolePermissions();
  const resetPermissions = useResetRolePermissions();
  const [draft, setDraft] = useState<{ roleId: string; ids: string[] } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [draftResource, setDraftResource] = useState(ALL);

  const canSave = can(rolePermissions.assignPermissions) || can(rolePermissions.update);
  const selectedRole = rolesQuery.data?.find((role) => role.id === selectedRoleId) ?? null;
  const canResetSuperadmin = canSave && isResettableSystemRole(selectedRole ?? undefined);
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

  const modules = useMemo(
    () => [...new Set(table.rows.map((row) => row.module))].sort(),
    [table.rows],
  );

  const resources = useMemo(() => {
    const source =
      moduleFilter === ALL ? table.rows : table.rows.filter((row) => row.module === moduleFilter);
    return [...new Set(source.map((row) => row.resource))].sort();
  }, [table.rows, moduleFilter]);

  const filteredRows = useMemo(
    () =>
      table.rows.filter((row) => {
        if (moduleFilter !== ALL && row.module !== moduleFilter) {
          return false;
        }
        if (resourceFilter !== ALL && row.resource !== resourceFilter) {
          return false;
        }
        return true;
      }),
    [table.rows, moduleFilter, resourceFilter],
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

  function replaceFilters(patch: {
    role_id?: string;
    module?: string | null;
    resource?: string | null;
  }) {
    const next = new URLSearchParams(searchParams.toString());
    if (patch.role_id !== undefined) {
      next.set("role_id", patch.role_id);
    }
    if (patch.module !== undefined) {
      if (patch.module && patch.module !== ALL) {
        next.set("module", patch.module);
      } else {
        next.delete("module");
      }
    }
    if (patch.resource !== undefined) {
      if (patch.resource && patch.resource !== ALL) {
        next.set("resource", patch.resource);
      } else {
        next.delete("resource");
      }
    }
    const query = next.toString();
    router.replace(query ? `/permissions?${query}` : "/permissions");
  }

  function selectRole(id: string) {
    setDraft(null);
    replaceFilters({ role_id: id });
  }

  function selectModule(value: string) {
    const nextResources = new Set(
      table.rows.filter((row) => value === ALL || row.module === value).map((row) => row.resource),
    );
    const nextResource =
      resourceFilter !== ALL && !nextResources.has(resourceFilter) ? ALL : resourceFilter;
    replaceFilters({ module: value, resource: nextResource });
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
      toast.success("Superadmin permissions reset");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const roles = rolesQuery.data ?? [];

  return (
    <ListPage>
      <PageHeader
        title="Permissions"
        subtitle="Assign catalog permissions to a role"
        actions={
          canSave ? (
            <div className="flex gap-2">
              {canResetSuperadmin ? (
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
              <Button
                type="button"
                size="sm"
                onClick={onSave}
                disabled={!selectedRoleId || pending}
              >
                {savePermissions.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Permissions
              </Button>
            </div>
          ) : undefined
        }
      />
      <DataTableToolbar className="items-start">
        <div className="flex w-56 flex-col items-start gap-1.5">
          <Label htmlFor="permissions-filter-role" className="text-muted-foreground">
            Role
          </Label>
          <FilterSelect
            id="permissions-filter-role"
            className="w-full"
            placeholder="Select a role"
            aria-label="Role"
            value={selectedRoleId ?? ""}
            onValueChange={selectRole}
            disabled={rolesQuery.isLoading || roles.length === 0}
            options={roles.map((role) => ({ value: role.id, label: role.name }))}
          />
        </div>
        <div className="flex w-56 flex-col items-start gap-1.5">
          <Label htmlFor="permissions-filter-module" className="text-muted-foreground">
            Module
          </Label>
          <FilterSelect
            id="permissions-filter-module"
            className="w-full"
            placeholder="All modules"
            aria-label="Module"
            value={moduleFilter}
            onValueChange={selectModule}
            disabled={matrixQuery.isLoading || modules.length === 0}
            options={[
              { value: ALL, label: "All modules" },
              ...modules.map((module) => ({ value: module, label: module })),
            ]}
          />
        </div>
        <div className="flex items-end self-end">
          <MoreFiltersDialog
            extraCount={resourceFilter !== ALL ? 1 : 0}
            draftCount={draftResource !== ALL ? 1 : 0}
            description="Narrow the matrix by resource."
            onOpen={() => setDraftResource(resourceFilter)}
            onApply={() => replaceFilters({ resource: draftResource })}
            onClearDraft={() => setDraftResource(ALL)}
          >
            <FilterField label="Resource" htmlFor="permissions-filter-resource">
              <FilterSelect
                id="permissions-filter-resource"
                className="w-full"
                placeholder="All resources"
                aria-label="Resource"
                value={draftResource}
                onValueChange={setDraftResource}
                disabled={matrixQuery.isLoading || resources.length === 0}
                options={[
                  { value: ALL, label: "All resources" },
                  ...resources.map((resource) => ({ value: resource, label: resource })),
                ]}
              />
            </FilterField>
          </MoreFiltersDialog>
        </div>
        {moduleFilter !== ALL || resourceFilter !== ALL ? (
          <div className="flex items-end self-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => replaceFilters({ module: ALL, resource: ALL })}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </DataTableToolbar>
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
      {!matrixQuery.isLoading && table.rows.length > 0 && filteredRows.length === 0 ? (
        <DataTableEmpty
          title="No permissions match these filters"
          message="Try a different module or resource."
        />
      ) : null}
      {!matrixQuery.isLoading && filteredRows.length > 0 && selectedRoleId ? (
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
            {filteredRows.map((row) => (
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
                    {canResetSuperadmin ? (
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
      <ConfirmActionDialog
        open={resetOpen}
        title="Reset Superadmin permissions"
        description="Restore the system Superadmin role to the full seeded permission catalog? Unsaved matrix edits will be discarded."
        confirmLabel="Reset to Default"
        variant="default"
        pending={resetPermissions.isPending}
        onOpenChange={setResetOpen}
        onConfirm={() => void onReset()}
      />
    </ListPage>
  );
}
