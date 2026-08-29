"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { PriceListFormDialog } from "@/modules/inventory-management/price-lists/components/price-list-form-dialog";
import { useDeletePriceList } from "@/modules/inventory-management/price-lists/mutations";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { usePriceLists } from "@/modules/inventory-management/price-lists/queries";
import {
  PRICE_LIST_TYPE_LABELS,
  type PriceList,
} from "@/modules/inventory-management/price-lists/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
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

const HEADERS = ["Name", "Type", "Currency", "Percent", "Status", "Actions"] as const;
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

export function PriceListsScreen() {
  const can = useCan();
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const priceListsQuery = usePriceLists({
    page,
    page_size,
    search,
    is_active: parseBoolFilter(filters.is_active),
  });
  const currenciesQuery = useAllCurrencies();
  const deletePriceList = useDeletePriceList();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<PriceList | null>(null);

  const rows = priceListsQuery.data?.data ?? [];
  const meta = priceListsQuery.data?.meta;
  const currencyLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const currency of currenciesQuery.data ?? []) {
      map.set(currency.id, currency.code);
    }
    return map;
  }, [currenciesQuery.data]);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deletePriceList.mutateAsync(deleting.id);
      toast.success("Price list deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Price lists"
        subtitle="Customer and item rate charts"
        actions={
          can(priceListPermissions.create) ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New Price List
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search price lists…"
        />
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
          {priceListsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : priceListsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(priceListsQuery.error)}
                  onRetry={() => priceListsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty
                  title="No price lists"
                  message="Create a price list to get started."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((priceList) => (
              <TableRow key={priceList.id}>
                <TableCell className="font-medium">
                  <Link href={`/price-lists/${priceList.id}`} className="hover:underline">
                    {priceList.name}
                  </Link>
                </TableCell>
                <TableCell>{PRICE_LIST_TYPE_LABELS[priceList.list_type]}</TableCell>
                <TableCell>{currencyLabelById.get(priceList.currency_id) ?? "—"}</TableCell>
                <TableCell>{priceList.percent ?? "—"}</TableCell>
                <TableCell>
                  <ActiveBadge active={priceList.is_active} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(priceListPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${priceList.name}`}
                        asChild
                      >
                        <Link href={`/price-lists/${priceList.id}`}>
                          <Edit2 className="size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                    {can(priceListPermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${priceList.name}`}
                        onClick={() => setDeleting(priceList)}
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
      <PriceListFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete price list"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this price list"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deletePriceList.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
