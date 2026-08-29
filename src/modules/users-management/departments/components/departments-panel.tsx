"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
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
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useCan } from "@/shared/providers/session-provider";

const HEADERS = ["Code", "Name", "Branch", "Manager", "Employees", "Actions"] as const;

export function DepartmentsPanel() {
  const can = useCan();
  const canRead = can(departmentPermissions.read);
  const canReadBranches = can(branchPermissions.read);
  const [branchId, setBranchId] = useState<"all" | string>("all");
  const departmentsQuery = useAllDepartments(
    { branch_id: branchId === "all" ? undefined : branchId },
    canRead,
  );
  const branchesQuery = useAllBranches(canRead && canReadBranches);
  const deleteDepartment = useDeleteDepartment();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const departments = departmentsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

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
          <Select value={branchId} onValueChange={(value) => setBranchId(value as typeof branchId)}>
            <SelectTrigger className="w-52" aria-label="Branch">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {can(departmentPermissions.create) ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New Department
          </Button>
        ) : null}
      </div>
      <DataTable>
        <TableHeader>
          <TableRow>
            {HEADERS.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {departmentsQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : departmentsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(departmentsQuery.error)}
                  onRetry={() => departmentsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : departments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty
                  title="No departments"
                  message="Create a department to get started."
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
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(departmentPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${department.name}`}
                        onClick={() => {
                          setEditing(department);
                          setFormOpen(true);
                        }}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    ) : null}
                    {can(departmentPermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${department.name}`}
                        onClick={() => setDeleting(department)}
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
      <DepartmentFormDialog
        open={formOpen}
        department={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
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
