"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { UnitFormDialog } from "@/modules/inventory-management/units/components/unit-form-dialog";
import { useDeleteUnit } from "@/modules/inventory-management/units/mutations";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { useUnits } from "@/modules/inventory-management/units/queries";
import type { Unit } from "@/modules/inventory-management/units/schemas";
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
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
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

export function UnitsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(unitPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const unitsQuery = useUnits({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteUnit = useDeleteUnit();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = unitsQuery.data?.data ?? [];
  const meta = unitsQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Unit>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        className: "font-mono text-sm",
        cell: (unit) => <RecordLink href={`/units/${unit.id}`}>{unit.code}</RecordLink>,
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (unit) => <RecordLink href={`/units/${unit.id}`}>{unit.name}</RecordLink>,
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (unit) => <ActiveBadge active={unit.is_active} />,
      },
      ...auditTimestampColumns<Unit>(),
      ...auditActorColumns<Unit>(userNameById),
      ...actionsColumn<Unit>(showActions, (unit) => (
        <DataTableRowActions
          entityName={unit.name}
          viewHref={canRead ? `/units/${unit.id}` : undefined}
          editHref={canUpdate ? `/units/${unit.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(unit) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.units", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteUnit.mutateAsync(deleting.id);
      toast.success("Unit deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Units"
        subtitle="Units of measure for products and services"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New Unit
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search code, name…"
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
          {unitsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : unitsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(unitsQuery.error)}
                  onRetry={() => unitsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No units"
                  message={emptyListMessage(canCreate, "Create a unit to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((unit) => (
              <TableRow key={unit.id}>
                <DataTableCells columns={columns} row={unit} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <UnitFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete unit"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this unit"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteUnit.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
