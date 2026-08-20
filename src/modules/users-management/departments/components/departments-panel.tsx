"use client";

import { Building, Edit2, Loader2, MapPin, Plus, Trash2, User, Users } from "lucide-react";
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
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
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
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useCan } from "@/shared/providers/session-provider";

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

  function openCreate() {
    setEditing(null);
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
          <Select value={branchId} onValueChange={(value) => setBranchId(value as typeof branchId)}>
            <SelectTrigger className="w-52">
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
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            New Department
          </Button>
        ) : null}
      </div>
      {departmentsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : null}
      {departmentsQuery.isError ? (
        <DataTableError
          message={getErrorMessage(departmentsQuery.error)}
          onRetry={() => departmentsQuery.refetch()}
        />
      ) : null}
      {!departmentsQuery.isLoading && !departmentsQuery.isError && departments.length === 0 ? (
        <DataTableEmpty title="No departments" message="Create a department to get started." />
      ) : null}
      {!departmentsQuery.isLoading && !departmentsQuery.isError ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <Card key={department.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                      <Building className="text-primary size-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{department.name}</p>
                      <p className="text-muted-foreground text-xs">{department.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {can(departmentPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
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
                        className="text-destructive size-8"
                        aria-label={`Delete ${department.name}`}
                        onClick={() => setDeleting(department)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="text-muted-foreground space-y-1 text-xs">
                  <p className="flex items-center gap-1">
                    <MapPin className="size-2.5" /> {department.branch?.name ?? "—"}
                  </p>
                  <p className="flex items-center gap-1">
                    <User className="size-2.5" /> Manager: {department.manager?.name ?? "—"}
                  </p>
                  <p className="flex items-center gap-1">
                    <Users className="size-2.5" /> {department.employee_count} employees
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
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
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleting ? `"${deleting.name}"` : "this department"}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDepartment.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteDepartment.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteDepartment.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
