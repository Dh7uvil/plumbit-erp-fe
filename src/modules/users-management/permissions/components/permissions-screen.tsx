"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  grantedPermissionIds,
  matrixActionColumns,
  permissionMatrixTable,
  sameIdSet,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { titleCase } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const MODULE_COL_CLASS = "w-36 min-w-36 max-w-36";
const RESOURCE_COL_CLASS = "w-48 min-w-48 max-w-48";
const ACTION_COL_CLASS = "w-24 min-w-24 max-w-24";
const FROZEN_SHADOW = "shadow-[2px_0_6px_-2px_rgba(0,0,0,0.18)]";

function writePermissionsQuery(params: URLSearchParams) {
  const query = params.toString();
  const href = query ? `/permissions?${query}` : "/permissions";
  window.history.replaceState(window.history.state, "", href);
}

export function PermissionsScreen() {
  const can = useCan();
  const searchParams = useSearchParams();
  const [roleIdParam, setRoleIdParam] = useState(() => searchParams.get("role_id"));
  const [moduleFilter, setModuleFilter] = useState(() => searchParams.get("module") ?? ALL);
  const [resourceFilter, setResourceFilter] = useState(() => searchParams.get("resource") ?? ALL);
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

  const visibleActions = useMemo(() => matrixActionColumns(filteredRows), [filteredRows]);

  useEffect(() => {
    if (!selectedRoleId || typeof window === "undefined") {
      return;
    }
    const next = new URLSearchParams(window.location.search);
    if (next.get("role_id") === selectedRoleId) {
      return;
    }
    next.set("role_id", selectedRoleId);
    writePermissionsQuery(next);
  }, [selectedRoleId]);

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
    const nextRoleId = patch.role_id !== undefined ? patch.role_id : selectedRoleId;
    const nextModule = patch.module !== undefined ? (patch.module ?? ALL) : moduleFilter;
    const nextResource = patch.resource !== undefined ? (patch.resource ?? ALL) : resourceFilter;

    if (patch.role_id !== undefined) {
      setRoleIdParam(patch.role_id);
    }
    if (patch.module !== undefined) {
      setModuleFilter(nextModule);
    }
    if (patch.resource !== undefined) {
      setResourceFilter(nextResource);
    }

    const next = new URLSearchParams();
    if (nextRoleId) {
      next.set("role_id", nextRoleId);
    }
    if (nextModule && nextModule !== ALL) {
      next.set("module", nextModule);
    }
    if (nextResource && nextResource !== ALL) {
      next.set("resource", nextResource);
    }
    writePermissionsQuery(next);
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
    const permissionIds = [...selectedIds];
    try {
      const detail = await savePermissions.mutateAsync({
        id: selectedRoleId,
        permissionIds,
      });
      setDraft(null);
      const returnedIds = detail.permissions.map((item) => item.id);
      if (returnedIds.length > 0 && !sameIdSet(permissionIds, returnedIds)) {
        toast.warning("The server kept a different permission set for this role.");
        return;
      }
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
        <DataTable
          tableClassName="min-w-full w-max table-fixed border-separate border-spacing-0 [&_th]:border-b [&_td]:border-b [&_th:not(:last-child)]:border-r [&_td:not(:last-child)]:border-r"
          footer={
            canSave ? (
              <div className="flex justify-end gap-2 px-3 py-2.5">
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
                  {savePermissions.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save Permissions
                </Button>
              </div>
            ) : null
          }
        >
          <colgroup>
            <col className={MODULE_COL_CLASS} style={{ width: "9rem" }} />
            <col className={RESOURCE_COL_CLASS} style={{ width: "12rem" }} />
            {visibleActions.map((action) => (
              <col key={action} className={ACTION_COL_CLASS} style={{ width: "6rem" }} />
            ))}
            <col />
          </colgroup>
          <TableHeader className="z-30">
            <TableRow>
              <TableHead className={`bg-card sticky left-0 z-40 truncate ${MODULE_COL_CLASS}`}>
                Module
              </TableHead>
              <TableHead
                className={`bg-card sticky left-36 z-40 truncate ${RESOURCE_COL_CLASS} ${FROZEN_SHADOW}`}
              >
                Resource
              </TableHead>
              {visibleActions.map((action) => (
                <TableHead
                  key={action}
                  className={`${ACTION_COL_CLASS} text-center whitespace-normal`}
                >
                  {titleCase(action)}
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={`${row.module}-${row.resource}`} className="group">
                <TableCell
                  className={`bg-card group-hover:bg-muted sticky left-0 z-10 truncate font-medium ${MODULE_COL_CLASS}`}
                >
                  {row.module}
                </TableCell>
                <TableCell
                  className={`bg-card group-hover:bg-muted sticky left-36 z-10 truncate ${RESOURCE_COL_CLASS} ${FROZEN_SHADOW}`}
                >
                  {row.resource}
                </TableCell>
                {visibleActions.map((action) => {
                  const permission = row.actions[action];
                  if (!permission) {
                    return <TableCell key={action} className={ACTION_COL_CLASS} />;
                  }
                  return (
                    <TableCell key={action} className={`${ACTION_COL_CLASS} text-center`}>
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
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
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
