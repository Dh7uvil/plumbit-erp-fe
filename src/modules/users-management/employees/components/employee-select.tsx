"use client";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { employeePermissions } from "@/modules/users-management/employees/permissions";
import { useActiveEmployees } from "@/modules/users-management/employees/queries";
import { MasterSelect } from "@/shared/components/form/master-select";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { useCan } from "@/shared/providers/session-provider";

export function EmployeeSelect({
  value,
  onValueChange,
  disabled = false,
  label = "Salesperson",
  noneLabel = "None",
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  noneLabel?: string;
}) {
  const can = useCan();
  const canRead = can(employeePermissions.read);
  const employeesQuery = useActiveEmployees(canRead && !disabled);
  const employees = employeesQuery.data ?? [];
  const selected = employees.find((employee) => employee.id === value);
  const options = [
    { value: OPTIONAL_SELECT_NONE, label: noneLabel },
    ...employees.map((employee) => ({
      value: employee.id,
      label: employee.designation
        ? `${employee.name} (${employee.employee_code} · ${employee.designation})`
        : `${employee.name} (${employee.employee_code})`,
    })),
  ];
  if (value && value !== OPTIONAL_SELECT_NONE && !selected) {
    options.splice(1, 0, { value, label: "Selected employee" });
  }

  if (!canRead) {
    return null;
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <MasterSelect
          value={value || OPTIONAL_SELECT_NONE}
          onValueChange={onValueChange}
          disabled={disabled || employeesQuery.isLoading}
          placeholder={noneLabel}
          searchPlaceholder="Search employees…"
          emptyText="No active employees"
          options={options}
          loading={employeesQuery.isLoading}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
