"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PaymentTermFormDialog } from "@/modules/erp/accounting/payment-terms/components/payment-term-form-dialog";
import { useDeletePaymentTerm } from "@/modules/erp/accounting/payment-terms/mutations";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { usePaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import type { PaymentTerm } from "@/modules/erp/accounting/payment-terms/schemas";
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
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "days", label: "Days" },
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

export function PaymentTermsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(paymentTermPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const paymentTermsQuery = usePaymentTerms({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deletePaymentTerm = useDeletePaymentTerm();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<PaymentTerm | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = paymentTermsQuery.data?.data ?? [];
  const meta = paymentTermsQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<PaymentTerm>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "max-w-xs min-w-0 font-medium",
        cell: (term) => (
          <RecordLink href={`/payment-terms/${term.id}`} className="block truncate">
            {term.name}
          </RecordLink>
        ),
      },
      {
        id: "days",
        header: "Days",
        sortableField: "days",
        cell: (term) => <RecordLink href={`/payment-terms/${term.id}`}>{term.days}</RecordLink>,
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
      ...auditTimestampColumns<PaymentTerm>(),
      ...auditActorColumns<PaymentTerm>(userNameById),
      ...actionsColumn<PaymentTerm>(showActions, (term) => (
        <DataTableRowActions
          entityName={term.name}
          viewHref={canRead ? `/payment-terms/${term.id}` : undefined}
          editHref={canUpdate ? `/payment-terms/${term.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(term) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.payment_terms", columnDefs);

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deletePaymentTerm.mutateAsync(deleting.id);
      toast.success("Payment term deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Payment terms"
        subtitle="Payment terms copied onto commercial documents"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Payment Term
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name, description…"
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
          {paymentTermsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : paymentTermsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(paymentTermsQuery.error)}
                  onRetry={() => paymentTermsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No payment terms"
                  message={emptyListMessage(canCreate, "Create a payment term to get started.")}
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
      <PaymentTermFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete payment term"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this payment term"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deletePaymentTerm.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
