"use client";

import { AlertCircle, ClipboardList, Search, Shield, Users, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { useAuditLogs, useAuditLogSummary } from "@/modules/users-management/audit-logs/queries";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULE_IDENTITY,
  type AuditLog,
  type AuditLogFilterParams,
  type AuditLogListParams,
} from "@/modules/users-management/audit-logs/schemas";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { getErrorMessage } from "@/shared/api/errors";
import { formatDateTime, initials, titleCase } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const COLUMNS = [
  "Log ID",
  "Timestamp",
  "User",
  "Action",
  "Resource",
  "ID",
  "Module",
  "IP Address",
  "Status",
] as const;

const ALL = "all";

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function startOfDayIso(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function endOfDayIso(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

type ActionBadgeVariant = "success" | "info" | "destructive" | "muted" | "default" | "warning";

function actionVariant(action: string): ActionBadgeVariant {
  switch (action.toUpperCase()) {
    case "CREATE":
    case "APPROVE":
    case "POST":
      return "success";
    case "UPDATE":
      return "info";
    case "DELETE":
      return "destructive";
    case "REJECT":
    case "CANCEL":
      return "warning";
    case "LOGIN":
    case "LOGOUT":
      return "default";
    default:
      return "muted";
  }
}

function statusVariant(status: string): "success" | "destructive" | "muted" {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "destructive";
    default:
      return "muted";
  }
}

function KpiCard({
  label,
  icon: Icon,
  value,
  isLoading,
}: {
  label: string;
  icon: LucideIcon;
  value: number | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-4 pb-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-16" />
          ) : (
            <p className="mt-1 font-mono text-2xl font-semibold">
              {value === undefined ? "—" : value.toLocaleString()}
            </p>
          )}
        </div>
        <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
          <Icon className="text-primary size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AuditLogsScreen() {
  const can = useCan();
  const canReadUsers = can(userPermissions.read);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState(ALL);
  const [actionFilter, setActionFilter] = useState(ALL);
  const [userFilter, setUserFilter] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const filterParams: AuditLogFilterParams = useMemo(
    () => ({
      search: search || undefined,
      module: moduleFilter === ALL ? undefined : moduleFilter,
      action: actionFilter === ALL ? undefined : actionFilter,
      user_id: userFilter === ALL ? undefined : userFilter,
      date_from: dateFrom ? startOfDayIso(dateFrom) : undefined,
      date_to: dateTo ? endOfDayIso(dateTo) : undefined,
    }),
    [search, moduleFilter, actionFilter, userFilter, dateFrom, dateTo],
  );

  const listParams: AuditLogListParams = useMemo(
    () => ({
      page,
      page_size: DEFAULT_PAGE_SIZE,
      ...filterParams,
    }),
    [page, filterParams],
  );

  const logsQuery = useAuditLogs(listParams);
  const summaryQuery = useAuditLogSummary(filterParams);
  const usersQuery = useAllUsers(canReadUsers);

  const rows = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;
  const users = usersQuery.data ?? [];

  const hasActiveFilters = Boolean(
    searchInput ||
    moduleFilter !== ALL ||
    actionFilter !== ALL ||
    userFilter !== ALL ||
    dateFrom ||
    dateTo,
  );

  const moduleOptions = useMemo(
    () =>
      uniqueSorted([
        AUDIT_MODULE_IDENTITY,
        ...(logsQuery.data?.data ?? []).map((row) => row.module),
        ...(moduleFilter !== ALL ? [moduleFilter] : []),
      ]),
    [logsQuery.data?.data, moduleFilter],
  );

  const actionOptions = useMemo(
    () =>
      uniqueSorted([
        ...AUDIT_ACTIONS,
        ...(logsQuery.data?.data ?? []).map((row) => row.action),
        ...(actionFilter !== ALL ? [actionFilter] : []),
      ]),
    [logsQuery.data?.data, actionFilter],
  );

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setModuleFilter(ALL);
    setActionFilter(ALL);
    setUserFilter(ALL);
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <ListPage>
      <PageHeader
        title="Audit Logs"
        subtitle="System activity and security trail — all user actions recorded"
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total Events"
          icon={ClipboardList}
          value={summaryQuery.data?.total_events}
          isLoading={summaryQuery.isLoading}
        />
        <KpiCard
          label="Unique Users"
          icon={Users}
          value={summaryQuery.data?.unique_users}
          isLoading={summaryQuery.isLoading}
        />
        <KpiCard
          label="Failed Attempts"
          icon={AlertCircle}
          value={summaryQuery.data?.failed_attempts}
          isLoading={summaryQuery.isLoading}
        />
        <KpiCard
          label="Admin Actions"
          icon={Shield}
          value={summaryQuery.data?.admin_actions}
          isLoading={summaryQuery.isLoading}
        />
      </div>
      <DataTableToolbar>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by user, resource…"
            className="w-48 pl-8 md:w-56"
          />
        </div>
        <FilterSelect
          className="w-36 md:w-40"
          placeholder="All Modules"
          value={moduleFilter}
          onValueChange={(value) => {
            setModuleFilter(value);
            setPage(1);
          }}
          options={[
            { value: ALL, label: "All Modules" },
            ...moduleOptions.map((module) => ({ value: module, label: titleCase(module) })),
          ]}
        />
        <FilterSelect
          className="w-32 md:w-36"
          placeholder="All Actions"
          value={actionFilter}
          onValueChange={(value) => {
            setActionFilter(value);
            setPage(1);
          }}
          options={[
            { value: ALL, label: "All Actions" },
            ...actionOptions.map((action) => ({ value: action, label: titleCase(action) })),
          ]}
        />
        {canReadUsers ? (
          <FilterSelect
            className="w-40 md:w-48"
            placeholder="All Users"
            value={userFilter}
            onValueChange={(value) => {
              setUserFilter(value);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All Users" },
              ...users.map((user) => ({ value: user.id, label: user.name })),
            ]}
          />
        ) : null}
        <Input
          type="date"
          value={dateFrom}
          onChange={(event) => {
            setDateFrom(event.target.value);
            setPage(1);
          }}
          aria-label="From date"
          className="w-36"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(event) => {
            setDateTo(event.target.value);
            setPage(1);
          }}
          aria-label="To date"
          className="w-36"
        />
        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={COLUMNS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : logsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length}>
                <DataTableError
                  message={getErrorMessage(logsQuery.error)}
                  onRetry={() => logsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length}>
                <DataTableEmpty
                  title="No audit logs"
                  message={
                    hasActiveFilters
                      ? "Try a different search or filter."
                      : "No activity has been recorded yet."
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((log) => <AuditLogRow key={log.id} log={log} />)
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const userName = log.user?.name ?? "Unknown";

  return (
    <TableRow>
      <TableCell className="text-muted-foreground font-mono text-xs" title={log.id}>
        {shortId(log.id)}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatDateTime(log.timestamp)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Avatar className="size-6">
            <AvatarFallback className="text-[9px]">{initials(userName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{userName}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={actionVariant(log.action)}>{titleCase(log.action)}</Badge>
      </TableCell>
      <TableCell className="text-sm">{titleCase(log.entity_type)}</TableCell>
      <TableCell
        className="text-muted-foreground font-mono text-xs"
        title={log.entity_id ?? undefined}
      >
        {log.entity_id ? shortId(log.entity_id) : "—"}
      </TableCell>
      <TableCell>
        <Badge variant="muted">{titleCase(log.module)}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground font-mono text-xs">
        {log.ip_address ?? "—"}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant(log.status)}>{titleCase(log.status)}</Badge>
      </TableCell>
    </TableRow>
  );
}
