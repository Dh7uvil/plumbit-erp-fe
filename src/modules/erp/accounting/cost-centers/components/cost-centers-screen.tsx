"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CostCenterFormDialog } from "@/modules/erp/accounting/cost-centers/components/cost-center-form-dialog";
import { useDeleteCostCenter } from "@/modules/erp/accounting/cost-centers/mutations";
import { costCenterPermissions } from "@/modules/erp/accounting/cost-centers/permissions";
import { useCostCenters } from "@/modules/erp/accounting/cost-centers/queries";
import type { CostCenter } from "@/modules/erp/accounting/cost-centers/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import {
  auditActorColumns,
  auditTimestampColumns,
  useUserNameMap,
} from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
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
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "code", label: "Code" },
  { value: "is_active", label: "Status" },
] as const;
const ALL = "all";

function parseBoolFilter(value: string | undefined): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

export function CostCentersScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(costCenterPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const costCentersQuery = useCostCenters({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteCostCenter = useDeleteCostCenter();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<CostCenter | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = costCentersQuery.data?.data ?? [];
  const meta = costCentersQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<CostCenter>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "max-w-xs min-w-0 font-medium",
        cell: (term) => (
          <RecordLink href={`/cost-centers/${term.id}`} className="block truncate">
            {term.name}
          </RecordLink>
        ),
      },
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        cell: (term) => (
          <RecordLink href={`/cost-centers/${term.id}`} className="font-mono text-sm">
            {term.code}
          </RecordLink>
        ),
      },
      {
        id: "description",
        header: "Description",
        className: "text-muted-foreground max-w-sm min-w-0 truncate",
        cell: (term) => term.description ?? "—",
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (term) => <ActiveBadge active={term.is_active} />,
      },
      ...auditTimestampColumns<CostCenter>(),
      ...auditActorColumns<CostCenter>(userNameById),
      ...actionsColumn<CostCenter>(showActions, (term) => (
        <DataTableRowActions
          entityName={term.name}
          viewHref={canRead ? `/cost-centers/${term.id}` : undefined}
          editHref={canUpdate ? `/cost-centers/${term.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(term) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.cost_centers", columnDefs);

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteCostCenter.mutateAsync(deleting.id);
      toast.success("Cost center deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Cost centers"
        subtitle="Reporting dimensions for journal lines and financial reports"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Cost Center
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name, code, description…"
        />
        <FilterSelect
          label="Status"
          className="w-36"
          placeholder="Status"
          value={filters.is_active ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_active: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.is_active || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
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
          {costCentersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : costCentersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(costCentersQuery.error)}
                  onRetry={() => costCentersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No cost centers"
                  message={emptyListMessage(canCreate, "Create a cost center to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((term) => (
              <TableRow key={term.id}>
                <DataTableCells columns={columns} row={term} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <CostCenterFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete cost center"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this cost center"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteCostCenter.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
