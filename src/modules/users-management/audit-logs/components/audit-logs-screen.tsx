"use client";

import { AlertCircle, ClipboardList, Shield, Users, type LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { AuditLogDetailSheet } from "@/modules/users-management/audit-logs/components/audit-log-detail-sheet";
import { auditLogPermissions } from "@/modules/users-management/audit-logs/permissions";
import { useAuditLogs, useAuditLogSummary } from "@/modules/users-management/audit-logs/queries";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULE_IDENTITY,
  parseAuditLogSortBy,
  type AuditLog,
  type AuditLogFilterParams,
  type AuditLogListParams,
} from "@/modules/users-management/audit-logs/schemas";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
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
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
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

const SORT_FIELDS = [
  { value: "created_at", label: "Timestamp" },
  { value: "action", label: "Action" },
  { value: "module", label: "Module" },
] as const;

const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Timestamp: "created_at",
  Action: "action",
  Module: "module",
};

const ALL = "all";

type ExtraFilters = {
  action: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
};

const EMPTY_EXTRA: ExtraFilters = {
  action: ALL,
  userId: ALL,
  dateFrom: "",
  dateTo: "",
};

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
  const { canRead } = useCrudPermissions(auditLogPermissions);
  const canReadUsers = can(userPermissions.read);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const showActions = hasRowActions(canRead);
  const headers = tableHeaders(COLUMNS, showActions);
  const moduleFilter = filters.module ?? ALL;
  const extraFilters: ExtraFilters = {
    action: filters.action ?? ALL,
    userId: filters.user_id ?? ALL,
    dateFrom: filters.date_from ?? "",
    dateTo: filters.date_to ?? "",
  };
  const [draftExtra, setDraftExtra] = useState<ExtraFilters>(EMPTY_EXTRA);

  const extraCount = [
    extraFilters.action !== ALL,
    extraFilters.userId !== ALL,
    Boolean(extraFilters.dateFrom),
    Boolean(extraFilters.dateTo),
  ].filter(Boolean).length;

  const filterParams: AuditLogFilterParams = useMemo(
    () => ({
      search: search || undefined,
      module: moduleFilter === ALL ? undefined : moduleFilter,
      action: extraFilters.action === ALL ? undefined : extraFilters.action,
      user_id: extraFilters.userId === ALL ? undefined : extraFilters.userId,
      date_from: extraFilters.dateFrom ? startOfDayIso(extraFilters.dateFrom) : undefined,
      date_to: extraFilters.dateTo ? endOfDayIso(extraFilters.dateTo) : undefined,
    }),
    [
      search,
      moduleFilter,
      extraFilters.action,
      extraFilters.userId,
      extraFilters.dateFrom,
      extraFilters.dateTo,
    ],
  );

  const sortBy = parseAuditLogSortBy(sort_by);

  const listParams: AuditLogListParams = useMemo(
    () => ({
      page,
      page_size,
      sort_by: sortBy,
      sort_order,
      ...filterParams,
    }),
    [page, page_size, sortBy, sort_order, filterParams],
  );

  const logsQuery = useAuditLogs(listParams);
  const summaryQuery = useAuditLogSummary(filterParams);
  const usersQuery = useAllUsers(canReadUsers);

  const rows = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;
  const users = usersQuery.data ?? [];

  const hasActiveFilters = Boolean(search || moduleFilter !== ALL || extraCount > 0 || sortBy);

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
        ...(extraFilters.action !== ALL ? [extraFilters.action] : []),
        ...(draftExtra.action !== ALL ? [draftExtra.action] : []),
      ]),
    [logsQuery.data?.data, extraFilters.action, draftExtra.action],
  );

  function extraToUrlPatch(extra: ExtraFilters): Record<string, string | null> {
    return {
      action: extra.action === ALL ? null : extra.action,
      user_id: extra.userId === ALL ? null : extra.userId,
      date_from: extra.dateFrom || null,
      date_to: extra.dateTo || null,
    };
  }

  function clearFilters() {
    setDraftExtra(EMPTY_EXTRA);
    setParams({
      search: null,
      sort_by: null,
      sort_order: null,
      filters: {
        module: null,
        ...extraToUrlPatch(EMPTY_EXTRA),
      },
    });
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
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value.trim() || null })}
          placeholder="Search by user, resource…"
        />
        <FilterSelect
          className="w-36 md:w-40"
          placeholder="All Modules"
          value={moduleFilter}
          onValueChange={(value) =>
            setParams({ filters: { module: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All Modules" },
            ...moduleOptions.map((module) => ({ value: module, label: titleCase(module) })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={
            [
              draftExtra.action !== ALL,
              draftExtra.userId !== ALL,
              Boolean(draftExtra.dateFrom),
              Boolean(draftExtra.dateTo),
            ].filter(Boolean).length
          }
          description="Filter by action, user, and date range."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() => setParams({ filters: extraToUrlPatch(draftExtra) })}
          onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
        >
          <FilterField label="Action" htmlFor="audit-filter-action">
            <FilterSelect
              id="audit-filter-action"
              className="w-full"
              placeholder="All Actions"
              value={draftExtra.action}
              onValueChange={(value) => setDraftExtra((current) => ({ ...current, action: value }))}
              options={[
                { value: ALL, label: "All Actions" },
                ...actionOptions.map((action) => ({ value: action, label: titleCase(action) })),
              ]}
            />
          </FilterField>
          {canReadUsers ? (
            <FilterField label="User" htmlFor="audit-filter-user">
              <FilterSelect
                id="audit-filter-user"
                className="w-full"
                placeholder="All Users"
                value={draftExtra.userId}
                onValueChange={(value) =>
                  setDraftExtra((current) => ({ ...current, userId: value }))
                }
                options={[
                  { value: ALL, label: "All Users" },
                  ...users.map((user) => ({ value: user.id, label: user.name })),
                ]}
              />
            </FilterField>
          ) : null}
          <FilterField label="From date" htmlFor="audit-filter-from">
            <Input
              id="audit-filter-from"
              type="date"
              value={draftExtra.dateFrom}
              onChange={(event) =>
                setDraftExtra((current) => ({ ...current, dateFrom: event.target.value }))
              }
            />
          </FilterField>
          <FilterField label="To date" htmlFor="audit-filter-to">
            <Input
              id="audit-filter-to"
              type="date"
              value={draftExtra.dateTo}
              onChange={(event) =>
                setDraftExtra((current) => ({ ...current, dateTo: event.target.value }))
              }
            />
          </FilterField>
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sortBy}
          sortOrder={sort_order}
          onApply={setParams}
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
            <SortableHeads
              headers={headers}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              sortBy={sortBy}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {logsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : logsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(logsQuery.error)}
                  onRetry={() => logsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
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
            rows.map((log) => (
              <AuditLogRow
                key={log.id}
                log={log}
                selected={viewingId === log.id}
                canRead={canRead}
                showActions={showActions}
                onView={() => setViewingId(log.id)}
              />
            ))
          )}
        </TableBody>
      </DataTable>
      <AuditLogDetailSheet
        logId={viewingId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingId(null);
          }
        }}
      />
    </ListPage>
  );
}

function ViewTrigger({
  enabled,
  onView,
  children,
  className,
}: {
  enabled: boolean;
  onView: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (!enabled) {
    return children;
  }
  return (
    <button
      type="button"
      className={className ?? "cursor-pointer hover:underline"}
      onClick={onView}
    >
      {children}
    </button>
  );
}

function AuditLogRow({
  log,
  selected,
  canRead,
  showActions,
  onView,
}: {
  log: AuditLog;
  selected: boolean;
  canRead: boolean;
  showActions: boolean;
  onView: () => void;
}) {
  const userName = log.user?.name ?? "Unknown";

  return (
    <TableRow data-state={selected ? "selected" : undefined}>
      <TableCell className="text-muted-foreground font-mono text-xs" title={log.id}>
        <ViewTrigger
          enabled={canRead}
          onView={onView}
          className="cursor-pointer font-mono hover:underline"
        >
          {shortId(log.id)}
        </ViewTrigger>
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
      <TableCell className="text-sm">
        <ViewTrigger enabled={canRead} onView={onView}>
          {titleCase(log.entity_type)}
        </ViewTrigger>
      </TableCell>
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
      {showActions ? (
        <TableCell>
          <DataTableRowActions
            entityName={`audit log ${shortId(log.id)}`}
            onView={canRead ? onView : undefined}
          />
        </TableCell>
      ) : null}
    </TableRow>
  );
}
