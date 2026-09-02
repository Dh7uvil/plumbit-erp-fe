"use client";

import { useMemo, useState } from "react";

import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { useAllDepartments } from "@/modules/users-management/departments/queries";
import type { Department } from "@/modules/users-management/departments/schemas";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { useAllRoles } from "@/modules/users-management/roles/queries";
import type {
  EmployeeStatus,
  UserListParams,
  UserListSortBy,
  UserStatus,
} from "@/modules/users-management/users/schemas";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import type { SortFieldOption } from "@/shared/components/data-table/sort";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all" as const;
const EMPTY_DEPARTMENTS: Department[] = [];

export const USER_SORT_FIELDS: SortFieldOption[] = [
  { value: "name", label: "User" },
  { value: "email", label: "Email" },
  { value: "status", label: "Status" },
  { value: "last_login_at", label: "Last login" },
  { value: "created_at", label: "Created" },
];

export const USER_SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  User: "name",
  Email: "email",
  Status: "status",
};

export type UserListFilterParams = Omit<UserListParams, "page" | "page_size">;

type ExtraFilters = {
  branchId: string;
  departmentId: string;
  employeeStatus: "all" | EmployeeStatus;
  managerId: string;
  designation: string;
  employeeCode: string;
  phone: string;
  joiningDateFrom: string;
  joiningDateTo: string;
  lastLoginFrom: string;
  lastLoginTo: string;
};

const EMPTY_EXTRA: ExtraFilters = {
  branchId: ALL,
  departmentId: ALL,
  employeeStatus: ALL,
  managerId: ALL,
  designation: "",
  employeeCode: "",
  phone: "",
  joiningDateFrom: "",
  joiningDateTo: "",
  lastLoginFrom: "",
  lastLoginTo: "",
};

function optionalId(value: string): string | undefined {
  return value === ALL ? undefined : value;
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function startOfDayIso(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function endOfDayIso(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function compactParams<T extends object>(params: T): T {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined) {
        return false;
      }
      return !(Array.isArray(value) && value.length === 0);
    }),
  ) as T;
}

function extraFilterCount(filters: ExtraFilters): number {
  return [
    filters.branchId !== ALL,
    filters.departmentId !== ALL,
    filters.employeeStatus !== ALL,
    filters.managerId !== ALL,
    Boolean(filters.designation.trim()),
    Boolean(filters.employeeCode.trim()),
    Boolean(filters.phone.trim()),
    Boolean(filters.joiningDateFrom),
    Boolean(filters.joiningDateTo),
    Boolean(filters.lastLoginFrom),
    Boolean(filters.lastLoginTo),
  ].filter(Boolean).length;
}

function extraFromUrl(filters: Record<string, string>): ExtraFilters {
  const employeeStatus = filters.employee_status;
  return {
    branchId: filters.branch_id ?? ALL,
    departmentId: filters.department_id ?? ALL,
    employeeStatus:
      employeeStatus === "ACTIVE" || employeeStatus === "INACTIVE" ? employeeStatus : ALL,
    managerId: filters.manager_id ?? ALL,
    designation: filters.designation ?? "",
    employeeCode: filters.employee_code ?? "",
    phone: filters.phone ?? "",
    joiningDateFrom: filters.joining_date_from ?? "",
    joiningDateTo: filters.joining_date_to ?? "",
    lastLoginFrom: filters.last_login_from ?? "",
    lastLoginTo: filters.last_login_to ?? "",
  };
}

function extraToUrlPatch(filters: ExtraFilters): Record<string, string | null> {
  return {
    branch_id: optionalId(filters.branchId) ?? null,
    department_id: optionalId(filters.departmentId) ?? null,
    employee_status: filters.employeeStatus === ALL ? null : filters.employeeStatus,
    manager_id: optionalId(filters.managerId) ?? null,
    designation: optionalText(filters.designation) ?? null,
    employee_code: optionalText(filters.employeeCode) ?? null,
    phone: optionalText(filters.phone) ?? null,
    joining_date_from: optionalText(filters.joiningDateFrom) ?? null,
    joining_date_to: optionalText(filters.joiningDateTo) ?? null,
    last_login_from: optionalText(filters.lastLoginFrom) ?? null,
    last_login_to: optionalText(filters.lastLoginTo) ?? null,
  };
}

function extraToParams(filters: ExtraFilters): UserListFilterParams {
  const joiningFrom = optionalText(filters.joiningDateFrom);
  const joiningTo = optionalText(filters.joiningDateTo);
  const joiningRangeValid = !(joiningFrom && joiningTo && joiningFrom > joiningTo);
  const loginFrom = optionalText(filters.lastLoginFrom);
  const loginTo = optionalText(filters.lastLoginTo);
  const loginRangeValid = !(loginFrom && loginTo && loginFrom > loginTo);

  return compactParams({
    branch_id: optionalId(filters.branchId),
    department_id: optionalId(filters.departmentId),
    employee_status: filters.employeeStatus === ALL ? undefined : filters.employeeStatus,
    manager_id: optionalId(filters.managerId),
    designation: optionalText(filters.designation),
    employee_code: optionalText(filters.employeeCode),
    phone: optionalText(filters.phone),
    joining_date_from: joiningRangeValid ? joiningFrom : undefined,
    joining_date_to: joiningRangeValid ? joiningTo : undefined,
    last_login_from: loginRangeValid && loginFrom ? startOfDayIso(loginFrom) : undefined,
    last_login_to: loginRangeValid && loginTo ? endOfDayIso(loginTo) : undefined,
  });
}

function parseUserStatus(value: string | undefined): UserStatus | undefined {
  if (value === "ACTIVE" || value === "INVITED" || value === "DISABLED") {
    return value;
  }
  return undefined;
}

const USER_SORT_BY = new Set<UserListSortBy>([
  "created_at",
  "updated_at",
  "name",
  "email",
  "status",
  "last_login_at",
]);

function parseUserSortBy(value: string | undefined): UserListSortBy | undefined {
  return value && USER_SORT_BY.has(value as UserListSortBy) ? (value as UserListSortBy) : undefined;
}

export function userListParamsFromTable(input: {
  page: number;
  page_size: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  filters: Record<string, string>;
}): UserListParams {
  const extra = extraFromUrl(input.filters);
  return compactParams({
    page: input.page,
    page_size: input.page_size,
    search: optionalText(input.search ?? ""),
    sort_by: parseUserSortBy(input.sort_by),
    sort_order: input.sort_order,
    status: parseUserStatus(input.filters.status),
    role_id: input.filters.role_id,
    ...extraToParams(extra),
  });
}

export function UsersTableFilters() {
  const can = useCan();
  const canReadRoles = can(rolePermissions.read);
  const canReadBranches = can(branchPermissions.read);
  const canReadDepartments = can(departmentPermissions.read);
  const { search, sort_by, sort_order, filters, setParams } = useTableParams();
  const extraFilters = extraFromUrl(filters);
  const status = parseUserStatus(filters.status) ?? ALL;
  const roleId = filters.role_id ?? ALL;

  const [draftExtra, setDraftExtra] = useState<ExtraFilters>(EMPTY_EXTRA);

  const rolesQuery = useAllRoles(canReadRoles);
  const branchesQuery = useAllBranches(canReadBranches);
  const departmentsQuery = useAllDepartments({}, canReadDepartments);

  const roles = rolesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const departments = departmentsQuery.data ?? EMPTY_DEPARTMENTS;

  const departmentOptions = useMemo(
    () =>
      draftExtra.branchId === ALL
        ? departments
        : departments.filter((department) => department.branch_id === draftExtra.branchId),
    [draftExtra.branchId, departments],
  );

  const managers = useMemo(() => {
    const byId = new Map<string, string>();
    for (const department of departments) {
      if (department.manager?.id) {
        byId.set(department.manager.id, department.manager.name);
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [departments]);

  const extraCount = extraFilterCount(extraFilters);
  const hasToolbarFilters = Boolean(search || status !== ALL || roleId !== ALL);
  const hasActiveFilters = hasToolbarFilters || extraCount > 0 || Boolean(sort_by);

  function clearFilters() {
    setDraftExtra(EMPTY_EXTRA);
    setParams({
      search: null,
      sort_by: null,
      sort_order: null,
      filters: {
        status: null,
        role_id: null,
        ...extraToUrlPatch(EMPTY_EXTRA),
      },
    });
  }

  function updateDraft<Key extends keyof ExtraFilters>(key: Key, value: ExtraFilters[Key]) {
    setDraftExtra((current) => ({ ...current, [key]: value }));
  }

  return (
    <DataTableToolbar>
      <ListSearch
        value={search ?? ""}
        onChange={(value) => setParams({ search: optionalText(value) ?? null })}
        placeholder="Search users…"
      />
      <FilterSelect
        className="w-40"
        placeholder="Status"
        value={status}
        onValueChange={(value) => setParams({ filters: { status: value === ALL ? null : value } })}
        options={[
          { value: ALL, label: "All statuses" },
          { value: "ACTIVE", label: "Active" },
          { value: "INVITED", label: "Invited" },
          { value: "DISABLED", label: "Disabled" },
        ]}
      />
      {canReadRoles ? (
        <FilterSelect
          className="w-48"
          placeholder="Role"
          value={roleId}
          onValueChange={(value) =>
            setParams({ filters: { role_id: value === ALL ? null : value } })
          }
          disabled={rolesQuery.isLoading}
          options={[
            { value: ALL, label: "All roles" },
            ...roles.map((role) => ({ value: role.id, label: role.name })),
          ]}
        />
      ) : null}
      <MoreFiltersDialog
        extraCount={extraCount}
        draftCount={extraFilterCount(draftExtra)}
        description="Narrow the user list by employee, branch, and login details."
        contentClassName="sm:max-w-2xl"
        onOpen={() => setDraftExtra(extraFilters)}
        onApply={() => setParams({ filters: extraToUrlPatch(draftExtra) })}
        onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
      >
        {canReadBranches ? (
          <FilterField label="Branch" htmlFor="user-filter-branch">
            <FilterSelect
              id="user-filter-branch"
              className="w-full"
              placeholder="Branch"
              value={draftExtra.branchId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({
                  ...current,
                  branchId: value,
                  departmentId: ALL,
                }))
              }
              disabled={branchesQuery.isLoading}
              options={[
                { value: ALL, label: "All branches" },
                ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
              ]}
            />
          </FilterField>
        ) : null}
        {canReadDepartments ? (
          <FilterField label="Department" htmlFor="user-filter-department">
            <FilterSelect
              id="user-filter-department"
              className="w-full"
              placeholder="Department"
              value={draftExtra.departmentId}
              onValueChange={(value) => updateDraft("departmentId", value)}
              disabled={departmentsQuery.isLoading}
              options={[
                { value: ALL, label: "All departments" },
                ...departmentOptions.map((department) => ({
                  value: department.id,
                  label: department.name,
                })),
              ]}
            />
          </FilterField>
        ) : null}
        <FilterField label="Employee status" htmlFor="user-filter-employee-status">
          <FilterSelect
            id="user-filter-employee-status"
            className="w-full"
            placeholder="Employee status"
            value={draftExtra.employeeStatus}
            onValueChange={(value) =>
              updateDraft("employeeStatus", value as ExtraFilters["employeeStatus"])
            }
            options={[
              { value: ALL, label: "All employee statuses" },
              { value: "ACTIVE", label: "Active employee" },
              { value: "INACTIVE", label: "Inactive employee" },
            ]}
          />
        </FilterField>
        {canReadDepartments && managers.length > 0 ? (
          <FilterField label="Manager" htmlFor="user-filter-manager">
            <FilterSelect
              id="user-filter-manager"
              className="w-full"
              placeholder="Manager"
              value={draftExtra.managerId}
              onValueChange={(value) => updateDraft("managerId", value)}
              options={[
                { value: ALL, label: "All managers" },
                ...managers.map((manager) => ({ value: manager.id, label: manager.name })),
              ]}
            />
          </FilterField>
        ) : null}
        <FilterField label="Designation" htmlFor="user-filter-designation">
          <Input
            id="user-filter-designation"
            value={draftExtra.designation}
            onChange={(event) => updateDraft("designation", event.target.value)}
            placeholder="Designation"
          />
        </FilterField>
        <FilterField label="Employee code" htmlFor="user-filter-employee-code">
          <Input
            id="user-filter-employee-code"
            value={draftExtra.employeeCode}
            onChange={(event) => updateDraft("employeeCode", event.target.value)}
            placeholder="EMP-001"
          />
        </FilterField>
        <FilterField label="Phone" htmlFor="user-filter-phone">
          <Input
            id="user-filter-phone"
            value={draftExtra.phone}
            onChange={(event) => updateDraft("phone", event.target.value)}
            placeholder="Phone"
          />
        </FilterField>
        <FilterField label="Joining date from" htmlFor="user-filter-joining-from">
          <Input
            id="user-filter-joining-from"
            type="date"
            value={draftExtra.joiningDateFrom}
            onChange={(event) => updateDraft("joiningDateFrom", event.target.value)}
          />
        </FilterField>
        <FilterField label="Joining date to" htmlFor="user-filter-joining-to">
          <Input
            id="user-filter-joining-to"
            type="date"
            value={draftExtra.joiningDateTo}
            onChange={(event) => updateDraft("joiningDateTo", event.target.value)}
          />
        </FilterField>
        <FilterField label="Last login from" htmlFor="user-filter-login-from">
          <Input
            id="user-filter-login-from"
            type="date"
            value={draftExtra.lastLoginFrom}
            onChange={(event) => updateDraft("lastLoginFrom", event.target.value)}
          />
        </FilterField>
        <FilterField label="Last login to" htmlFor="user-filter-login-to">
          <Input
            id="user-filter-login-to"
            type="date"
            value={draftExtra.lastLoginTo}
            onChange={(event) => updateDraft("lastLoginTo", event.target.value)}
          />
        </FilterField>
      </MoreFiltersDialog>
      <SortDialog
        fields={USER_SORT_FIELDS}
        sortBy={sort_by}
        sortOrder={sort_order}
        onApply={setParams}
      />
      {hasActiveFilters ? (
        <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
          Clear
        </Button>
      ) : null}
    </DataTableToolbar>
  );
}
