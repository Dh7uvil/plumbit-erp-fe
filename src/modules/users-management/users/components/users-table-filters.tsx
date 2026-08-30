"use client";

import { ListFilter, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { useAllDepartments } from "@/modules/users-management/departments/queries";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { useAllRoles } from "@/modules/users-management/roles/queries";
import type {
  EmployeeStatus,
  UserListParams,
  UserStatus,
} from "@/modules/users-management/users/schemas";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all" as const;

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

function compactParams(params: UserListFilterParams): UserListFilterParams {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined) {
        return false;
      }
      return !(Array.isArray(value) && value.length === 0);
    }),
  ) as UserListFilterParams;
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

export function UsersTableFilters({
  onChange,
}: {
  onChange: (params: UserListFilterParams) => void;
}) {
  const can = useCan();
  const canReadRoles = can(rolePermissions.read);
  const canReadBranches = can(branchPermissions.read);
  const canReadDepartments = can(departmentPermissions.read);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | UserStatus>(ALL);
  const [roleId, setRoleId] = useState<string>(ALL);
  const [extraFilters, setExtraFilters] = useState<ExtraFilters>(EMPTY_EXTRA);
  const [draftExtra, setDraftExtra] = useState<ExtraFilters>(EMPTY_EXTRA);
  const [moreOpen, setMoreOpen] = useState(false);

  const rolesQuery = useAllRoles(canReadRoles);
  const branchesQuery = useAllBranches(canReadBranches);
  const departmentsQuery = useAllDepartments({}, canReadDepartments);

  const roles = rolesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];

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

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const params = useMemo((): UserListFilterParams => {
    const selectedRole = optionalId(roleId);
    return compactParams({
      search: optionalText(search),
      status: status === ALL ? undefined : status,
      role_ids: selectedRole ? [selectedRole] : undefined,
      ...extraToParams(extraFilters),
    });
  }, [search, status, roleId, extraFilters]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(params);
  }, [params]);

  const extraCount = extraFilterCount(extraFilters);
  const hasToolbarFilters = Boolean(searchInput || status !== ALL || roleId !== ALL);
  const hasActiveFilters = hasToolbarFilters || extraCount > 0;

  function openMoreFilters() {
    setDraftExtra(extraFilters);
    setMoreOpen(true);
  }

  function applyExtraFilters() {
    setExtraFilters(draftExtra);
    setMoreOpen(false);
  }

  function clearExtraDraft() {
    setDraftExtra(EMPTY_EXTRA);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus(ALL);
    setRoleId(ALL);
    setExtraFilters(EMPTY_EXTRA);
    setDraftExtra(EMPTY_EXTRA);
    setMoreOpen(false);
  }

  function updateDraft<Key extends keyof ExtraFilters>(key: Key, value: ExtraFilters[Key]) {
    setDraftExtra((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <DataTableToolbar>
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search users…"
            className="pl-8"
          />
        </div>
        <FilterSelect
          className="w-40"
          placeholder="Status"
          value={status}
          onValueChange={(value) => setStatus(value as typeof status)}
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
            onValueChange={setRoleId}
            disabled={rolesQuery.isLoading}
            options={[
              { value: ALL, label: "All roles" },
              ...roles.map((role) => ({ value: role.id, label: role.name })),
            ]}
          />
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={openMoreFilters}>
          <ListFilter className="size-3.5" />
          More filters
          {extraCount > 0 ? (
            <Badge variant="secondary" className="h-5 min-w-5 px-1">
              {extraCount}
            </Badge>
          ) : null}
        </Button>
        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>More filters</DialogTitle>
            <DialogDescription>
              Narrow the user list by employee, branch, and login details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {canReadBranches ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-filter-branch">Branch</Label>
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
              </div>
            ) : null}
            {canReadDepartments ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-filter-department">Department</Label>
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
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-filter-employee-status">Employee status</Label>
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
            </div>
            {canReadDepartments && managers.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-filter-manager">Manager</Label>
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
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-filter-designation">Designation</Label>
              <Input
                id="user-filter-designation"
                value={draftExtra.designation}
                onChange={(event) => updateDraft("designation", event.target.value)}
                placeholder="Designation"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-filter-employee-code">Employee code</Label>
              <Input
                id="user-filter-employee-code"
                value={draftExtra.employeeCode}
                onChange={(event) => updateDraft("employeeCode", event.target.value)}
                placeholder="EMP-001"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-filter-phone">Phone</Label>
              <Input
                id="user-filter-phone"
                value={draftExtra.phone}
                onChange={(event) => updateDraft("phone", event.target.value)}
                placeholder="Phone"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-filter-joining-from">Joining date from</Label>
              <Input
                id="user-filter-joining-from"
                type="date"
                value={draftExtra.joiningDateFrom}
                onChange={(event) => updateDraft("joiningDateFrom", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-filter-joining-to">Joining date to</Label>
              <Input
                id="user-filter-joining-to"
                type="date"
                value={draftExtra.joiningDateTo}
                onChange={(event) => updateDraft("joiningDateTo", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-filter-login-from">Last login from</Label>
              <Input
                id="user-filter-login-from"
                type="date"
                value={draftExtra.lastLoginFrom}
                onChange={(event) => updateDraft("lastLoginFrom", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-filter-login-to">Last login to</Label>
              <Input
                id="user-filter-login-to"
                type="date"
                value={draftExtra.lastLoginTo}
                onChange={(event) => updateDraft("lastLoginTo", event.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {extraFilterCount(draftExtra) > 0 ? (
              <Button type="button" variant="ghost" onClick={clearExtraDraft}>
                Clear extra
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setMoreOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyExtraFilters}>
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
