"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OutboxEventDetailSheet } from "@/modules/users-management/outbox/components/outbox-event-detail-sheet";
import { useRetryOutboxEvent } from "@/modules/users-management/outbox/mutations";
import { outboxPermissions } from "@/modules/users-management/outbox/permissions";
import { useOutboxEvents } from "@/modules/users-management/outbox/queries";
import {
  OUTBOX_STATUSES,
  OUTBOX_STATUS_LABELS,
  parseOutboxSortBy,
  type OutboxEvent,
  type OutboxListParams,
} from "@/modules/users-management/outbox/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
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
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDateTime, humanizeEnum } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const COLUMN_HEADERS = ["Event", "Aggregate", "Status", "Attempts", "Created", "Error"] as const;
const SORT_FIELDS = [
  { value: "created_at", label: "Created" },
  { value: "status", label: "Status" },
  { value: "event_type", label: "Event" },
  { value: "attempts", label: "Attempts" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Event: "event_type",
  Status: "status",
  Attempts: "attempts",
  Created: "created_at",
};
const ALL = "all";

function statusVariant(status: string): "success" | "destructive" | "warning" | "muted" | "info" {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
      return "success";
    case "FAILED":
    case "DEAD":
      return "destructive";
    case "PROCESSING":
      return "info";
    case "PENDING":
      return "warning";
    default:
      return "muted";
  }
}

function canRetryEvent(row: OutboxEvent): boolean {
  if (row.available_actions.includes("retry")) {
    return true;
  }
  const status = row.status.toUpperCase();
  return status === "FAILED" || status === "DEAD";
}

export function OutboxEventsScreen() {
  const can = useCan();
  const canRetry = can(outboxPermissions.retry);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const statusFilter = filters.status ?? ALL;
  const sortBy = parseOutboxSortBy(sort_by);
  const listParams: OutboxListParams = useMemo(
    () => ({
      page,
      page_size,
      search,
      sort_by: sortBy ?? "created_at",
      sort_order: sort_order ?? "desc",
      status: statusFilter === ALL ? undefined : statusFilter,
    }),
    [page, page_size, search, sortBy, sort_order, statusFilter],
  );
  const eventsQuery = useOutboxEvents(listParams);
  const retryEvent = useRetryOutboxEvent();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<OutboxEvent | null>(null);
  const rows = eventsQuery.data?.data ?? [];
  const meta = eventsQuery.data?.meta;
  const showActions = hasRowActions(true, canRetry);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onConfirmRetry() {
    if (!retrying) {
      return;
    }
    try {
      await retryEvent.mutateAsync(retrying.id);
      toast.success("Outbox event queued for retry");
      setRetrying(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Outbox"
        subtitle="Queued events for email and integrations. Retry sends the same payload again."
      />
      <DataTableToolbar>
        <ListSearch value={search ?? ""} onChange={(value) => setParams({ search: value })} />
        <FilterSelect
          className="w-44"
          placeholder="Status"
          aria-label="Filter by status"
          value={statusFilter}
          onValueChange={(value) => setParams({ filters: { status: value === ALL ? null : value } })}
          options={[
            { value: ALL, label: "All statuses" },
            ...OUTBOX_STATUSES.map((status) => ({
              value: status,
              label: OUTBOX_STATUS_LABELS[status],
            })),
          ]}
        />
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sortBy}
          sortOrder={sort_order}
          onApply={(next) => setParams({ sort_by: next.sort_by, sort_order: next.sort_order })}
        />
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <SortableHeads
              headers={headers}
              sortBy={sortBy}
              sortOrder={sort_order}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              onSort={(next) => setParams({ sort_by: next.sort_by, sort_order: next.sort_order })}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : eventsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(eventsQuery.error)}
                  onRetry={() => eventsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No outbox events"
                  message="Queued integration events will appear here."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{humanizeEnum(row.event_type)}</TableCell>
                <TableCell>
                  {row.aggregate_type ? humanizeEnum(row.aggregate_type) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)}>
                    {OUTBOX_STATUS_LABELS[row.status] ?? humanizeEnum(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">{row.attempts}</TableCell>
                <TableCell>{formatDateTime(row.created_at)}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {row.last_error ?? "—"}
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={row.event_type}
                      onView={() => setViewingId(row.id)}
                      extra={
                        canRetry && canRetryEvent(row) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRetrying(row)}
                          >
                            Retry
                          </Button>
                        ) : null
                      }
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <OutboxEventDetailSheet eventId={viewingId} onOpenChange={(open) => !open && setViewingId(null)} />
      <ConfirmActionDialog
        open={Boolean(retrying)}
        title="Retry outbox event"
        description={
          retrying
            ? `${humanizeEnum(retrying.event_type)} will be queued for another publish attempt.`
            : ""
        }
        confirmLabel="Retry"
        variant="default"
        pending={retryEvent.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setRetrying(null);
          }
        }}
        onConfirm={() => {
          void onConfirmRetry();
        }}
      />
    </ListPage>
  );
}
