"use client";

import { useFormContext } from "react-hook-form";

import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { useAllDepartments } from "@/modules/users-management/departments/queries";
import {
  EMPLOYEE_SELECT_NONE,
  type EmployeeFormFields,
} from "@/modules/users-management/users/schemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useCan } from "@/shared/providers/session-provider";

export function UserEmployeeFields() {
  const can = useCan();
  const { control, setValue, watch } = useFormContext<EmployeeFormFields>();
  const canReadBranches = can(branchPermissions.read);
  const canReadDepartments = can(departmentPermissions.read);
  const branchesQuery = useAllBranches(canReadBranches);
  const departmentsQuery = useAllDepartments({}, canReadDepartments);
  const branchId = watch("branch_id");
  const branches = branchesQuery.data ?? [];
  const departments = (departmentsQuery.data ?? []).filter((department) =>
    branchId === EMPLOYEE_SELECT_NONE ? false : department.branch_id === branchId,
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Employee</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          control={control}
          name="employee_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee code</FormLabel>
              <FormControl>
                <Input placeholder="EMP-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
            <FormItem>
              <FormLabel>Joining date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {canReadBranches ? (
          <FormField
            control={control}
            name="branch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("department_id", EMPLOYEE_SELECT_NONE);
                  }}
                  disabled={branchesQuery.isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={EMPLOYEE_SELECT_NONE}>None</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={departmentsQuery.isLoading || branchId === EMPLOYEE_SELECT_NONE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          branchId === EMPLOYEE_SELECT_NONE
                            ? "Select a branch first"
                            : "Select a department"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={EMPLOYEE_SELECT_NONE}>None</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
