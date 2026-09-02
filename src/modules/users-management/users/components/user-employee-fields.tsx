"use client";

import { useState, type ReactNode } from "react";
import { useFormContext } from "react-hook-form";

import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { DepartmentFormDialog } from "@/modules/users-management/departments/components/department-form-dialog";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { useAllDepartments } from "@/modules/users-management/departments/queries";
import {
  EMPLOYEE_SELECT_NONE,
  type EmployeeFormFields,
} from "@/modules/users-management/users/schemas";
import { MasterSelect } from "@/shared/components/form/master-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useCan } from "@/shared/providers/session-provider";

export function UserEmployeeFields({
  assignedCode = null,
  showEmployeeCode = false,
  leading,
}: {
  assignedCode?: string | null;
  showEmployeeCode?: boolean;
  leading?: ReactNode;
}) {
  const can = useCan();
  const { control, setValue, watch } = useFormContext<EmployeeFormFields>();
  const canReadBranches = can(branchPermissions.read);
  const canReadDepartments = can(departmentPermissions.read);
  const branchesQuery = useAllBranches(canReadBranches);
  const departmentsQuery = useAllDepartments({}, canReadDepartments);
  const [creating, setCreating] = useState<"branch" | "department" | null>(null);
  const branchId = watch("branch_id");
  const branches = branchesQuery.data ?? [];
  const departments = (departmentsQuery.data ?? []).filter((department) =>
    branchId === EMPLOYEE_SELECT_NONE ? false : department.branch_id === branchId,
  );

  return (
    <div className="flex flex-col gap-3">
      <div
        className={
          leading
            ? "grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]"
            : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        }
      >
        {leading}
        {showEmployeeCode ? (
          <FormItem>
            <Label htmlFor="employee-code">Employee code</Label>
            <Input
              id="employee-code"
              disabled
              readOnly
              value={assignedCode ?? ""}
              placeholder="EMP202601"
            />
          </FormItem>
        ) : null}
        <FormField
          control={control}
          name="designation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Designation</FormLabel>
              <FormControl>
                <Input placeholder="Operations Manager" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="joining_date"
          render={({ field }) => (
            <FormItem className="sm:w-max">
              <FormLabel>Joining date</FormLabel>
              <FormControl>
                <Input type="date" className="w-auto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {canReadBranches || canReadDepartments ? (
          <div
            className={
              canReadBranches && canReadDepartments
                ? "col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2"
                : "col-span-full"
            }
          >
            {canReadBranches ? (
              <FormField
                control={control}
                name="branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <MasterSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue("department_id", EMPLOYEE_SELECT_NONE);
                      }}
                      disabled={branchesQuery.isLoading}
                      placeholder="Select a branch"
                      searchPlaceholder="Search branch…"
                      createLabel="Create branch"
                      onCreate={
                        can(branchPermissions.create) ? () => setCreating("branch") : undefined
                      }
                      options={[
                        { value: EMPLOYEE_SELECT_NONE, label: "None" },
                        ...branches.map((branch) => ({
                          value: branch.id,
                          label: branch.name,
                        })),
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            {canReadDepartments ? (
              <FormField
                control={control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <MasterSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={departmentsQuery.isLoading || branchId === EMPLOYEE_SELECT_NONE}
                      placeholder={
                        branchId === EMPLOYEE_SELECT_NONE
                          ? "Select a branch first"
                          : "Select a department"
                      }
                      searchPlaceholder="Search department…"
                      createLabel="Create department"
                      onCreate={
                        can(departmentPermissions.create) && branchId !== EMPLOYEE_SELECT_NONE
                          ? () => setCreating("department")
                          : undefined
                      }
                      options={[
                        { value: EMPLOYEE_SELECT_NONE, label: "None" },
                        ...departments.map((department) => ({
                          value: department.id,
                          label: department.name,
                        })),
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      <BranchFormDialog
        open={creating === "branch"}
        branch={null}
        nested
        onCreated={(entity) => {
          setValue("branch_id", entity.id);
          setValue("department_id", EMPLOYEE_SELECT_NONE);
        }}
        onOpenChange={(open) => setCreating(open ? "branch" : null)}
      />
      <DepartmentFormDialog
        open={creating === "department"}
        department={null}
        nested
        defaultBranchId={branchId === EMPLOYEE_SELECT_NONE ? undefined : branchId}
        onCreated={(entity) => setValue("department_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "department" : null)}
      />
    </div>
  );
}
