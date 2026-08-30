"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { useDeleteSupplier } from "@/modules/erp/suppliers/mutations";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useSuppliers } from "@/modules/erp/suppliers/queries";
import {
  COMPANY_TYPE_LABELS,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  type Supplier,
  type TaxTreatment,
} from "@/modules/erp/suppliers/schemas";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
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
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
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

const COLUMN_HEADERS = ["Code", "Name", "Type", "Tax treatment", "Status"] as const;
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

function parseTaxTreatment(value: string | undefined): TaxTreatment | undefined {
  return TAX_TREATMENTS.includes(value as TaxTreatment) ? (value as TaxTreatment) : undefined;
}

function deleteDescription(supplier: Supplier | null): string {
  if (!supplier) {
    return "Delete this supplier? This cannot be undone.";
  }
  if (supplier.company_type === "BOTH") {
    return `Delete "${supplier.name}"? This party will disappear from both Customers and Suppliers. This cannot be undone.`;
  }
  return `Delete "${supplier.name}"? This cannot be undone.`;
}

export function SuppliersScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(supplierPermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const suppliersQuery = useSuppliers({
    page,
    page_size,
    search,
    tax_treatment: parseTaxTreatment(filters.tax_treatment),
    currency_id: filters.currency_id,
    is_active: parseBoolFilter(filters.is_active),
  });
  const currenciesQuery = useAllCurrencies();
  const deleteSupplier = useDeleteSupplier();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const rows = suppliersQuery.data?.data ?? [];
  const meta = suppliersQuery.data?.meta;
  const currencies = currenciesQuery.data ?? [];
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteSupplier.mutateAsync(deleting.id);
      toast.success("Supplier deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Suppliers"
        subtitle="Purchase-side supplier master"
        actions={
          canCreate ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setFormOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New Supplier
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search suppliers…"
        />
        <FilterSelect
          className="w-44"
          placeholder="Tax treatment"
          value={filters.tax_treatment ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { tax_treatment: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All treatments" },
            ...TAX_TREATMENTS.map((treatment) => ({
              value: treatment,
              label: TAX_TREATMENT_LABELS[treatment],
            })),
          ]}
        />
        <FilterSelect
          className="w-40"
          placeholder="Currency"
          value={filters.currency_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { currency_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All currencies" },
            ...currencies.map((currency) => ({ value: currency.id, label: currency.code })),
          ]}
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
          {suppliersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : suppliersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(suppliersQuery.error)}
                  onRetry={() => suppliersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No suppliers"
                  message={emptyListMessage(canCreate, "Create a supplier to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/suppliers/${supplier.id}`}>{supplier.code}</RecordLink>
                </TableCell>
                <TableCell className="font-medium">
                  <RecordLink href={`/suppliers/${supplier.id}`}>{supplier.name}</RecordLink>
                </TableCell>
                <TableCell>{COMPANY_TYPE_LABELS[supplier.company_type]}</TableCell>
                <TableCell>{TAX_TREATMENT_LABELS[supplier.tax_treatment]}</TableCell>
                <TableCell>
                  <ActiveBadge active={supplier.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={supplier.name}
                      viewHref={canRead ? `/suppliers/${supplier.id}` : undefined}
                      editHref={canUpdate ? `/suppliers/${supplier.id}/edit` : undefined}
                      onDelete={canDelete ? () => setDeleting(supplier) : undefined}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <SupplierFormDialog open={formOpen} supplier={null} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete supplier"
        description={deleteDescription(deleting)}
        confirmLabel="Delete"
        pending={deleteSupplier.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
