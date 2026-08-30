"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TaxFormDialog } from "@/modules/erp/accounting/taxes/components/tax-form-dialog";
import { useDeleteTax } from "@/modules/erp/accounting/taxes/mutations";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { useTaxes } from "@/modules/erp/accounting/taxes/queries";
import { TAX_CATEGORY_LABELS, type Tax } from "@/modules/erp/accounting/taxes/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const COLUMN_HEADERS = ["Name", "Category", "Rate", "Default", "Status"] as const;
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

export function TaxesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(taxPermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const taxesQuery = useTaxes({
    page,
    page_size,
    search,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteTax = useDeleteTax();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Tax | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const rows = taxesQuery.data?.data ?? [];
  const meta = taxesQuery.data?.meta;

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteTax.mutateAsync(deleting.id);
      toast.success("Tax deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Taxes"
        subtitle="UAE VAT tax master used on quote lines"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Tax
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search taxes…"
        />
        <FilterSelect
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
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {taxesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : taxesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(taxesQuery.error)}
                  onRetry={() => taxesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No taxes"
                  message={emptyListMessage(canCreate, "Create a tax to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((tax) => (
              <TableRow key={tax.id}>
                <TableCell className="font-medium">
                  <RecordLink href={`/taxes/${tax.id}`}>{tax.name}</RecordLink>
                </TableCell>
                <TableCell>
                  <RecordLink href={`/taxes/${tax.id}`}>
                    {TAX_CATEGORY_LABELS[tax.tax_category]}
                  </RecordLink>
                </TableCell>
                <TableCell>{`${tax.rate}%`}</TableCell>
                <TableCell>
                  {tax.is_default ? <Badge variant="info">Default</Badge> : "—"}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={tax.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={tax.name}
                      viewHref={canRead ? `/taxes/${tax.id}` : undefined}
                      editHref={canUpdate ? `/taxes/${tax.id}/edit` : undefined}
                      onDelete={canDelete ? () => setDeleting(tax) : undefined}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <TaxFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete tax"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this tax"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteTax.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
