"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BankAccountForm } from "@/modules/erp/accounting/bank-accounts/components/bank-account-form";
import { useDeleteBankAccount } from "@/modules/erp/accounting/bank-accounts/mutations";
import { bankAccountPermissions } from "@/modules/erp/accounting/bank-accounts/permissions";
import { useBankAccounts } from "@/modules/erp/accounting/bank-accounts/queries";
import type { BankAccount } from "@/modules/erp/accounting/bank-accounts/schemas";
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
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

export function BankAccountsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(bankAccountPermissions);
  const { page, page_size, search, sort_by, sort_order, setParams, setPage } = useTableParams();
  const query = useBankAccounts({ page, page_size, search, sort_by, sort_order });
  const deleteBankAccount = useDeleteBankAccount();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState<BankAccount | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  const columns = useMemo<DataTableColumn<BankAccount>[]>(
    () => [
      { id: "account_name", header: "Account", cell: (row) => row.account_name },
      { id: "bank_name", header: "Bank", cell: (row) => row.bank_name },
      { id: "account_number", header: "Number", cell: (row) => row.account_number ?? "—" },
      { id: "is_default", header: "Default", cell: (row) => (row.is_default ? "Yes" : "No") },
      { id: "is_active", header: "Status", cell: (row) => <ActiveBadge active={row.is_active} /> },
      ...actionsColumn<BankAccount>(showActions, (row) => (
        <DataTableRowActions
          onEdit={canUpdate ? () => setEditing(row) : undefined}
          onDelete={canDelete ? () => setDeleting(row) : undefined}
        />
      )),
    ],
    [canDelete, canUpdate, showActions],
  );
  const { columns: columnsForTable, colSpan } = useTableColumns("bank-accounts", columns);

  return (
    <ListPage>
      <PageHeader
        title="Bank accounts"
        subtitle="Link GL bank accounts to bank identity and reconciliation metadata."
        actions={
          canCreate ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New bank account
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value, page: 1 })}
        />
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads columns={columnsForTable} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <Skeleton className="h-8 w-full" />
              </TableCell>
            </TableRow>
          ) : query.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(query.error)}
                  onRetry={() => query.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No bank accounts"
                  message={emptyListMessage(canCreate, "Create a bank account to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <DataTableCells columns={columnsForTable} row={row} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New bank account</DialogTitle>
          </DialogHeader>
          <BankAccountForm
            showCancel
            onCancel={() => setFormOpen(false)}
            onSuccess={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit bank account</DialogTitle>
          </DialogHeader>
          {editing ? (
            <BankAccountForm
              bankAccount={editing}
              showCancel
              onCancel={() => setEditing(null)}
              onSuccess={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete bank account"
        description="This removes the bank account master. Posted GL history is unchanged."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteBankAccount.mutateAsync(deleting.id);
            toast.success("Bank account deleted");
            setDeleting(null);
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
      />
    </ListPage>
  );
}
