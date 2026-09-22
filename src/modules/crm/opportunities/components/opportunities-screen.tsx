"use client";

import { LayoutGrid, Plus, Table2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OpportunityBoard } from "@/modules/crm/opportunities/components/opportunity-board";
import { OpportunityFormDialog } from "@/modules/crm/opportunities/components/opportunity-form-dialog";
import { OpportunityStatusBadge } from "@/modules/crm/opportunities/components/opportunity-status-badge";
import { useDeleteOpportunity } from "@/modules/crm/opportunities/mutations";
import { opportunityPermissions } from "@/modules/crm/opportunities/permissions";
import { useOpportunities } from "@/modules/crm/opportunities/queries";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
  type Opportunity,
  type OpportunityStatus,
} from "@/modules/crm/opportunities/schemas";
import { useAllPipelines, usePipeline } from "@/modules/crm/pipelines/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import {
  auditActorColumns,
  auditTimestampColumns,
  useUserNameMap,
} from "@/shared/components/data-table/audit-columns";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatMoney } from "@/shared/lib/format";

const SORT_FIELDS = [
  { value: "opportunity_number", label: "Number" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "amount", label: "Amount" },
  { value: "created_at", label: "Created" },
] as const;
const ALL = "all";
const BOARD_PAGE_SIZE = 200;

export function OpportunitiesScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(opportunityPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const statusFilter = filters.status;
  const pipelineFilter = filters.pipeline_id;
  const view = filters.view === "board" ? "board" : "table";
  const pipelinesQuery = useAllPipelines();
  const pipelines = pipelinesQuery.data ?? [];
  const defaultPipelineId = pipelines.find((row) => row.is_default)?.id ?? pipelines[0]?.id;
  const activePipelineId =
    pipelineFilter && pipelineFilter !== ALL ? pipelineFilter : defaultPipelineId;
  const pipelineQuery = usePipeline(activePipelineId ?? null);
  const currenciesQuery = useAllCurrencies();
  const currencyCodeById = useMemo(
    () => new Map((currenciesQuery.data ?? []).map((currency) => [currency.id, currency.code])),
    [currenciesQuery.data],
  );

  useEffect(() => {
    if (!pipelineFilter && defaultPipelineId) {
      setParams({ filters: { pipeline_id: defaultPipelineId } });
    }
  }, [defaultPipelineId, pipelineFilter, setParams]);

  const listParams = {
    page: view === "board" ? 1 : page,
    page_size: view === "board" ? BOARD_PAGE_SIZE : page_size,
    search,
    sort_by,
    sort_order,
    status: statusFilter && statusFilter !== ALL ? (statusFilter as OpportunityStatus) : undefined,
    pipeline_id: activePipelineId,
  };
  const opportunitiesQuery = useOpportunities(listParams);
  const deleteOpportunity = useDeleteOpportunity();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Opportunity | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const userNameById = useUserNameMap();

  const rows = opportunitiesQuery.data?.data ?? [];
  const meta = opportunitiesQuery.data?.meta;
  const stages = pipelineQuery.data?.stages ?? [];

  const columnDefs = useMemo((): Array<DataTableColumn<Opportunity>> => {
    return [
      {
        id: "opportunity_number",
        header: "Number",
        sortableField: "opportunity_number",
        className: "font-mono text-xs",
        cell: (row) => (
          <RecordLink href={`/opportunities/${row.id}`} className="block truncate">
            {row.opportunity_number}
          </RecordLink>
        ),
      },
      {
        id: "name",
        header: "Opportunity",
        sortableField: "name",
        className: "max-w-xs min-w-0 font-medium",
        cell: (row) => (
          <RecordLink href={`/opportunities/${row.id}`} className="block truncate">
            {row.name}
          </RecordLink>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (row) => <OpportunityStatusBadge status={row.status} />,
      },
      {
        id: "amount",
        header: "Amount",
        sortableField: "amount",
        className: "tabular-nums",
        cell: (row) => {
          const code = row.currency_id ? currencyCodeById.get(row.currency_id) : undefined;
          return row.amount && code ? formatMoney(row.amount, code) : "—";
        },
      },
      {
        id: "owner_id",
        header: "Owner",
        cell: (row) => (row.owner_id ? (userNameById.get(row.owner_id) ?? "—") : "—"),
      },
      ...auditTimestampColumns<Opportunity>(),
      ...auditActorColumns<Opportunity>(userNameById),
      ...actionsColumn<Opportunity>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.name}
          viewHref={canRead ? `/opportunities/${row.id}` : undefined}
          editHref={
            canUpdate && row.status === "OPEN" ? `/opportunities/${row.id}/edit` : undefined
          }
          onDelete={canDelete && row.status === "OPEN" ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, currencyCodeById, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("crm.opportunities", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteOpportunity.mutateAsync(deleting.id);
      toast.success("Opportunity deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Opportunities"
        subtitle="Track deals through your sales pipeline"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New opportunity
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name or number…"
        />
        <FilterSelect
          label="Pipeline"
          className="w-44"
          placeholder="Pipeline"
          value={activePipelineId ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { pipeline_id: value === ALL ? null : value }, page: 1 })
          }
          options={[
            { value: ALL, label: "All pipelines" },
            ...pipelines.map((pipeline) => ({ value: pipeline.id, label: pipeline.name })),
          ]}
        />
        <FilterSelect
          label="Status"
          className="w-36"
          placeholder="Status"
          value={statusFilter ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value }, page: 1 })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...OPPORTUNITY_STATUSES.map((status) => ({
              value: status,
              label: OPPORTUNITY_STATUS_LABELS[status],
            })),
          ]}
        />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "secondary" : "outline"}
            onClick={() => setParams({ filters: { view: null }, page: 1 })}
            aria-label="Table view"
          >
            <Table2 className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "board" ? "secondary" : "outline"}
            onClick={() => setParams({ filters: { view: "board" }, page: 1 })}
            aria-label="Board view"
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
        {view === "table" ? (
          <SortDialog
            fields={[...SORT_FIELDS]}
            sortBy={sort_by}
            sortOrder={sort_order}
            onApply={setParams}
          />
        ) : null}
        {view === "table" ? columnsDialog : null}
      </DataTableToolbar>
      {view === "board" ? (
        opportunitiesQuery.isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : opportunitiesQuery.isError ? (
          <DataTableError
            message={getErrorMessage(opportunitiesQuery.error)}
            onRetry={() => opportunitiesQuery.refetch()}
          />
        ) : !activePipelineId ? (
          <DataTableEmpty title="No pipeline" message="Configure a pipeline to use the board." />
        ) : (
          <OpportunityBoard stages={stages} opportunities={rows} />
        )
      ) : (
        <DataTable
          footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
        >
          <TableHeader>
            <TableRow>
              <DataTableColumnHeads
                columns={columns}
                sortBy={sort_by}
                sortOrder={sort_order}
                onSort={setParams}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunitiesQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : opportunitiesQuery.isError ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableError
                    message={getErrorMessage(opportunitiesQuery.error)}
                    onRetry={() => opportunitiesQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableEmpty
                    title="No opportunities"
                    message={emptyListMessage(
                      canCreate,
                      "Create an opportunity to start tracking pipeline value.",
                    )}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <DataTableCells columns={columns} row={row} />
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      )}
      <OpportunityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={(entity) => router.push(`/opportunities/${entity.id}`)}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete opportunity"
        description={deleting ? `Delete ${deleting.name}? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        pending={deleteOpportunity.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
