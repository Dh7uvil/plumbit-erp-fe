"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AccountFormDialog } from "@/modules/erp/accounting/accounts/components/account-form-dialog";
import { useDeleteAccount } from "@/modules/erp/accounting/accounts/mutations";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useAccounts } from "@/modules/erp/accounting/accounts/queries";
import {
  ACCOUNT_SUBTYPE_LABELS,
  ledgerMainSubNumbers,
  type Account,
} from "@/modules/erp/accounting/accounts/schemas";
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
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage, ListPageContent } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
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

export function AccountsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(accountPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const accountsQuery = useAccounts({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
    is_blocked: parseBoolFilter(filters.is_blocked),
  });
  const deleteAccount = useDeleteAccount();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const rows = accountsQuery.data?.data ?? [];
  const meta = accountsQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Account>> => {
    return [
      {
        id: "main_no",
        header: "Main no.",
        sortableField: "code",
        className: "font-mono text-sm",
        cell: (row) => {
          const { main } = ledgerMainSubNumbers(row);
          return <span>{main}</span>;
        },
      },
      {
        id: "sub_no",
        header: "Sub no.",
        className: "font-mono text-sm",
        cell: (row) => {
          const { sub } = ledgerMainSubNumbers(row);
          return (
            <RecordLink href={`/accounts/${row.id}`}>{sub === "—" ? row.code : sub}</RecordLink>
          );
        },
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        cell: (row) => <RecordLink href={`/accounts/${row.id}`}>{row.name}</RecordLink>,
      },
      {
        id: "subtype",
        header: "Financial category",
        cell: (row) => ACCOUNT_SUBTYPE_LABELS[row.account_subtype],
      },
      {
        id: "is_blocked",
        header: "Blocked",
        cell: (row) =>
          row.is_blocked ? <Badge variant="destructive">Yes</Badge> : <span>—</span>,
      },
      {
        id: "is_active",
        header: "Status",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
      ...auditTimestampColumns<Account>(),
      ...auditActorColumns<Account>(userNameById),
      ...actionsColumn<Account>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.code}
          viewHref={canRead ? `/accounts/${row.id}` : undefined}
          editHref={canUpdate ? `/accounts/${row.id}/edit` : undefined}
          onDelete={canDelete && !row.is_system ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.accounts", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteAccount.mutateAsync(deleting.id);
      toast.success("Account deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!canRead) {
    return null;
  }

  return (
    <ListPage>
      <PageHeader
        title="Ledger master"
        subtitle="Chart of accounts"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New account
            </Button>
          ) : undefined
        }
      />
      <ListPageContent>
        <DataTableToolbar className="shrink-0">
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
          <FilterSelect
            label="Blocked"
            className="w-36"
            placeholder="Blocked"
            value={filters.is_blocked ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { is_blocked: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All" },
              { value: "true", label: "Blocked" },
              { value: "false", label: "Not blocked" },
            ]}
          />
          <SortDialog
            fields={[...SORT_FIELDS]}
            sortBy={sort_by}
            sortOrder={sort_order}
            onApply={setParams}
          />
          {columnsDialog}
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
            {accountsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : accountsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableError
                    message={getErrorMessage(accountsQuery.error)}
                    onRetry={() => accountsQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableEmpty
                    title="No accounts"
                    message={emptyListMessage(canCreate, "Create an account to get started.")}
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
      <AccountFormDialog open={formOpen} account={null} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete account"
        description={`Delete ${deleting ? `"${deleting.code} ${deleting.name}"` : "this account"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteAccount.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
