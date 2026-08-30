"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { DepartmentFormDialog } from "@/modules/users-management/departments/components/department-form-dialog";
import { useDeleteDepartment } from "@/modules/users-management/departments/mutations";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { useAllDepartments } from "@/modules/users-management/departments/queries";
import type { Department } from "@/modules/users-management/departments/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useCan } from "@/shared/providers/session-provider";

const COLUMN_HEADERS = ["Code", "Name", "Branch", "Manager", "Employees"] as const;

export function DepartmentsPanel() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(departmentPermissions);
  const can = useCan();
  const canReadBranches = can(branchPermissions.read);
  const [branchId, setBranchId] = useState<"all" | string>("all");
  const departmentsQuery = useAllDepartments(
    { branch_id: branchId === "all" ? undefined : branchId },
    canRead,
  );
  const branchesQuery = useAllBranches(canRead && canReadBranches);
  const deleteDepartment = useDeleteDepartment();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const departments = departmentsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  function openCreate() {
    setSelected(null);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  function openView(department: Department) {
    setSelected(department);
    setForceReadOnly(true);
    setFormOpen(true);
  }

  function openEdit(department: Department) {
    setSelected(department);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteDepartment.mutateAsync(deleting.id);
      toast.success("Department deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!canRead) {
    return (
      <DataTableEmpty
        title="Departments are not available"
        message="You do not have permission to view departments."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canReadBranches ? (
          <FilterSelect
            className="w-52"
            placeholder="All branches"
            aria-label="Branch"
            value={branchId}
            onValueChange={(value) => setBranchId(value as typeof branchId)}
            options={[
              { value: "all", label: "All branches" },
              ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
            ]}
          />
        ) : null}
        {canCreate ? (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            New Department
          </Button>
        ) : null}
      </div>
      <DataTable>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {departmentsQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : departmentsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(departmentsQuery.error)}
                  onRetry={() => departmentsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : departments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No departments"
                  message={emptyListMessage(canCreate, "Create a department to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-mono text-sm">{department.code}</TableCell>
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell>{department.branch?.name ?? "—"}</TableCell>
                <TableCell>{department.manager?.name ?? "—"}</TableCell>
                <TableCell>{department.employee_count}</TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={department.name}
                      onView={canRead ? () => openView(department) : undefined}
                      onEdit={canUpdate ? () => openEdit(department) : undefined}
                      onDelete={canDelete ? () => setDeleting(department) : undefined}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <DepartmentFormDialog
        open={formOpen}
        department={selected}
        forceReadOnly={forceReadOnly}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelected(null);
            setForceReadOnly(false);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete department"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this department"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteDepartment.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
