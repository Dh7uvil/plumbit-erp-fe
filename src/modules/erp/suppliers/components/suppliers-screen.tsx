"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
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
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const HEADERS = ["Code", "Name", "Type", "Tax treatment", "Status", "Actions"] as const;
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
  const can = useCan();
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
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Suppliers"
        subtitle="Purchase-side supplier master"
        actions={
          can(supplierPermissions.create) ? (
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
        <Select
          value={filters.tax_treatment ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { tax_treatment: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tax treatment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All treatments</SelectItem>
            {TAX_TREATMENTS.map((treatment) => (
              <SelectItem key={treatment} value={treatment}>
                {TAX_TREATMENT_LABELS[treatment]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.currency_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { currency_id: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All currencies</SelectItem>
            {currencies.map((currency) => (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.is_active ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_active: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {HEADERS.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : suppliersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(suppliersQuery.error)}
                  onRetry={() => suppliersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty title="No suppliers" message="Create a supplier to get started." />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-mono text-sm">
                  <Link href={`/suppliers/${supplier.id}`} className="hover:underline">
                    {supplier.code}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{COMPANY_TYPE_LABELS[supplier.company_type]}</TableCell>
                <TableCell>{TAX_TREATMENT_LABELS[supplier.tax_treatment]}</TableCell>
                <TableCell>
                  <ActiveBadge active={supplier.is_active} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(supplierPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${supplier.name}`}
                        asChild
                      >
                        <Link href={`/suppliers/${supplier.id}`}>
                          <Edit2 className="size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                    {can(supplierPermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${supplier.name}`}
                        onClick={() => setDeleting(supplier)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
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
    </div>
  );
}
