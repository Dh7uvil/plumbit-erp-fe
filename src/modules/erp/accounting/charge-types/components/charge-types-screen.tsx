"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { ChargeTypeFormDialog } from "@/modules/erp/accounting/charge-types/components/charge-type-form-dialog";
import {
  useDeleteChargeType,
  useUpdateChargeType,
} from "@/modules/erp/accounting/charge-types/mutations";
import { chargeTypePermissions } from "@/modules/erp/accounting/charge-types/permissions";
import { useChargeTypes } from "@/modules/erp/accounting/charge-types/queries";
import {
  CHARGE_APPLIES_TO_LABELS,
  type ChargeType,
} from "@/modules/erp/accounting/charge-types/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage, ListPageContent } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

export function ChargeTypesScreen() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(chargeTypePermissions);
  const { page, page_size, search, sort_by, sort_order, setParams, setPage } = useTableParams();
  const chargeTypesQuery = useChargeTypes({
    page,
    page_size,
    search,
    sort_by: sort_by ?? "sort_order",
    sort_order: sort_order ?? "asc",
  });
  const accountsQuery = useAllAccounts({ is_active: true });
  const updateChargeType = useUpdateChargeType();
  const deleteChargeType = useDeleteChargeType();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChargeType | null>(null);
  const [deleting, setDeleting] = useState<ChargeType | null>(null);
  const showActions = hasRowActions(canUpdate, canDelete);

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of accountsQuery.data ?? []) {
      map.set(account.id, `${account.code} — ${account.name}`);
    }
    return map;
  }, [accountsQuery.data]);

  const rows = chargeTypesQuery.data?.data ?? [];
  const meta = chargeTypesQuery.data?.meta;

  const toggleInventoriable = async (row: ChargeType, checked: boolean) => {
    if (!canUpdate) {
      return;
    }
    try {
      await updateChargeType.mutateAsync({
        id: row.id,
        payload: { is_inventoriable: checked },
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const updateDefaultAccount = async (row: ChargeType, accountId: string) => {
    if (!canUpdate || !accountId || accountId === row.default_account_id) {
      return;
    }
    try {
      await updateChargeType.mutateAsync({
        id: row.id,
        payload: { default_account_id: accountId },
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const accountOptions = useMemo(
    () =>
      (accountsQuery.data ?? []).map((account) => ({
        value: account.id,
        label: `${account.code} — ${account.name}`,
      })),
    [accountsQuery.data],
  );

  const columnDefs = useMemo((): Array<DataTableColumn<ChargeType>> => {
    const cols: Array<DataTableColumn<ChargeType>> = [
      {
        id: "name",
        header: "Charge",
        sortableField: "name",
        cell: (row) => (
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-muted-foreground font-mono text-xs">{row.code}</div>
          </div>
        ),
      },
      {
        id: "applies_to",
        header: "Applies to",
        cell: (row) => CHARGE_APPLIES_TO_LABELS[row.applies_to],
      },
      {
        id: "is_inventoriable",
        header: "Capitalize to stock",
        cell: (row) => (
          <Checkbox
            checked={row.is_inventoriable}
            disabled={!canUpdate}
            onCheckedChange={(value) => void toggleInventoriable(row, value === true)}
            aria-label={`Capitalize ${row.name}`}
          />
        ),
      },
      {
        id: "default_account_id",
        header: "Default GL account",
        cell: (row) =>
          canUpdate ? (
            <MasterSelect
              compact
              asFormControl={false}
              value={row.default_account_id}
              onValueChange={(value) => void updateDefaultAccount(row, value)}
              disabled={accountsQuery.isLoading || updateChargeType.isPending}
              placeholder="Select account"
              searchPlaceholder="Search account…"
              options={accountOptions}
            />
          ) : (
            (accountNameById.get(row.default_account_id) ?? row.default_account_id)
          ),
      },
      {
        id: "allocation_basis",
        header: "Allocation basis",
        cell: (row) => row.allocation_basis ?? "Follow charge allocation",
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
    ];
    cols.push(
      ...actionsColumn<ChargeType>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.name}
          onEdit={
            canUpdate
              ? () => {
                  setEditing(row);
                  setFormOpen(true);
                }
              : undefined
          }
          onDelete={canDelete ? () => setDeleting(row) : undefined}
        />
      )),
    );
    return cols;
  }, [
    accountNameById,
    accountOptions,
    accountsQuery.isLoading,
    canDelete,
    canUpdate,
    showActions,
    updateChargeType.isPending,
  ]);

  const { columns, colSpan } = useTableColumns("erp.charge_types", columnDefs);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteChargeType.mutateAsync(deleting.id);
      toast.success("Charge type deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Charge types"
        subtitle="Import and export charge taxonomy, GL defaults, and inventoriable treatment."
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New charge type
            </Button>
          ) : undefined
        }
      />
      <ListPageContent>
        <DataTableToolbar className="shrink-0">
          <ListSearch
            value={search ?? ""}
            onChange={(value) => setParams({ search: value || null })}
            placeholder="Search charges…"
          />
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
            {chargeTypesQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : chargeTypesQuery.isError ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableError
                    message={getErrorMessage(chargeTypesQuery.error)}
                    onRetry={() => chargeTypesQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableEmpty
                    title="No charge types"
                    message={emptyListMessage(canCreate, "charge type")}
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
      </ListPageContent>
      <ChargeTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        chargeType={editing}
        onSaved={() => setEditing(null)}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete charge type"
        description={
          deleting
            ? `Delete "${deleting.name}" (${deleting.code})? Existing GRN or cost sheet lines that reference it may be affected.`
            : ""
        }
        confirmLabel="Delete"
        pending={deleteChargeType.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
