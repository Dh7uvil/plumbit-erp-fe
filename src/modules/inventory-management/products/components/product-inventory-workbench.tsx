"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { TradingHistoryLines } from "@/modules/inventory-management/history/components/trading-history-lines";
import { historyPermissions } from "@/modules/inventory-management/history/permissions";
import { TRADING_HISTORY_POSTING_STATUSES } from "@/modules/inventory-management/history/schemas";
import { useAllCategories } from "@/modules/inventory-management/categories/queries";
import { ProductInquiryPanel } from "@/modules/inventory-management/products/components/product-inquiry-panel";
import { buildProductInventoryListColumnDefs } from "@/modules/inventory-management/products/components/product-inventory-list-columns";
import { ProductInventoryListGrid } from "@/modules/inventory-management/products/components/product-inventory-list-grid";
import { ProductPurchaseDetailsTable } from "@/modules/inventory-management/products/components/product-purchase-details-table";
import { ProductQuantityRowsTable } from "@/modules/inventory-management/products/components/product-quantity-rows-table";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import {
  useProduct,
  useProductInventoryList,
  useProductInquiry,
  useProductPurchaseDetails,
} from "@/modules/inventory-management/products/queries";
import type {
  ProductInquiry,
  ProductInventoryListRow,
} from "@/modules/inventory-management/products/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableError, DataTableEmpty } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { cn } from "@/shared/lib/cn";
import { formatFixedDecimal, formatMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const DEFAULT_PAGE_SIZE = 50;

type SummaryField =
  | { id: string; label: string; kind: "money"; emphasize?: boolean; value: string | null | undefined }
  | { id: string; label: string; kind: "qty"; value: string | undefined }
  | { id: string; label: string; kind: "text"; value: string | null | undefined };

function formatSummaryMoney(value: string | null | undefined, code: string) {
  if (value == null || value === "") {
    return "—";
  }
  return formatMoney(value, code);
}

function buildSummaryFields(
  row: ProductInventoryListRow,
  inquiry: ProductInquiry | null | undefined,
): SummaryField[] {
  const avgCost =
    inquiry?.avg_cost ?? row.avg_cost ?? row.purchase_rate ?? null;
  const lastPurchase =
    inquiry?.last_purchase_price ?? row.last_purchase_price ?? null;

  return [
    { id: "avg_cost", label: "Avg. cost", kind: "money", emphasize: true, value: avgCost },
    { id: "last_purchase", label: "Last purchase", kind: "money", value: lastPurchase },
    { id: "selling_rate", label: "Def. sale", kind: "money", value: row.selling_rate },
    { id: "price_1", label: "Price 1", kind: "money", value: row.price_1 },
    { id: "price_2", label: "Price 2", kind: "money", value: row.price_2 },
    { id: "ordered_qty", label: "Ordered", kind: "qty", value: row.ordered_qty },
    { id: "brand", label: "Brand", kind: "text", value: row.brand },
    { id: "engine", label: "Engine", kind: "text", value: row.engine },
  ];
}

function SelectedItemSummary({
  row,
  inquiry,
}: {
  row: ProductInventoryListRow;
  inquiry?: ProductInquiry | null;
}) {
  const { baseCurrencyCode } = useBaseCurrency();
  const code = baseCurrencyCode ?? "";
  const fields = buildSummaryFields(row, inquiry);

  function formatValue(field: SummaryField) {
    if (field.kind === "money") {
      return formatSummaryMoney(field.value, code);
    }
    if (field.kind === "qty") {
      return formatFixedDecimal(String(field.value ?? "0"), 3);
    }
    return field.value?.trim() || "—";
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
      {fields.map((field) => (
        <div
          key={field.id}
          className="bg-background min-w-[6.5rem] shrink-0 rounded-lg border px-3 py-2"
        >
          <p className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
            {field.label}
          </p>
          <p
            className={cn(
              "mt-0.5 truncate text-sm tabular-nums",
              field.kind === "money" && field.emphasize && "font-semibold",
            )}
            title={formatValue(field)}
          >
            {formatValue(field)}
          </p>
        </div>
      ))}
    </div>
  );
}

function WorkbenchSection({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-card rounded-xl border shadow-sm", className)}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
      </div>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </section>
  );
}

export function ProductInventoryWorkbench({
  title,
  subtitle,
  headerActions,
  detailActions,
  trackedOnly = true,
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: {
  title: string;
  subtitle: string;
  headerActions?: ReactNode;
  detailActions?: (productId: string) => ReactNode;
  trackedOnly?: boolean;
  defaultPageSize?: number;
}) {
  const can = useCan();
  const enabled = can(productPermissions.read);
  const canHistory = can(historyPermissions.product);
  const { page, page_size, search, filters, setParams, setPage, setPageSize } = useTableParams();
  const categoriesQuery = useAllCategories(enabled);
  const categories = categoriesQuery.data ?? [];
  const categoryId = filters.category_id ?? ALL;
  const { baseCurrencyCode } = useBaseCurrency();
  const inventoryListColumnDefs = useMemo(
    () => buildProductInventoryListColumnDefs(baseCurrencyCode ?? ""),
    [baseCurrencyCode],
  );
  const { columns, columnsDialog, colSpan } = useTableColumns(
    "inventory.product_inventory_lookup",
    inventoryListColumnDefs,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [postingStatus, setPostingStatus] = useState<string>("POSTED");
  const [supplierName, setSupplierName] = useState("");

  const effectivePageSize = page_size ?? defaultPageSize;

  const listQuery = useProductInventoryList(
    {
      page,
      page_size: effectivePageSize,
      search,
      category_id: categoryId !== ALL ? categoryId : undefined,
      sort_by: "sku",
      tracked_only: trackedOnly,
    },
    enabled,
  );

  const rows = listQuery.data?.data ?? [];
  const totalItems = listQuery.data?.meta?.total;

  const rowIdsKey = useMemo(() => rows.map((row) => row.product_id).join(","), [rows]);

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current && rows.some((row) => row.product_id === current)) {
        return current;
      }
      return rows[0]!.product_id;
    });
  }, [rowIdsKey, rows]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.product_id === selectedId) ?? null,
    [rows, selectedId],
  );

  const productQuery = useProduct(selectedId);
  const inquiryQuery = useProductInquiry(selectedId);
  const localPurchases = useProductPurchaseDetails(
    selectedId,
    {
      kind: "LOCAL",
      posting_status: "ALL",
      name: supplierName.trim() || undefined,
      page: 1,
      page_size: 50,
    },
    Boolean(selectedId) && canHistory,
  );
  const importPurchases = useProductPurchaseDetails(
    selectedId,
    {
      kind: "IMPORT",
      posting_status: "ALL",
      name: supplierName.trim() || undefined,
      page: 1,
      page_size: 50,
    },
    Boolean(selectedId) && canHistory,
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }
      event.preventDefault();
      setSelectedId((current) => {
        if (rows.length === 0) {
          return current;
        }
        const index = rows.findIndex((row) => row.product_id === current);
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const next = index < 0 ? 0 : Math.min(rows.length - 1, Math.max(0, index + delta));
        return rows[next]!.product_id;
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rows]);

  if (!enabled) {
    return null;
  }

  function renderDetailPanel() {
    if (!selectedId) {
      return (
        <DataTableEmpty
          title="No item selected"
          message={
            listQuery.isLoading
              ? "Loading items…"
              : rows.length === 0
                ? "Adjust filters or add products to get started."
                : "Click a row in the table above, or use ↑ ↓ to move selection."
          }
        />
      );
    }
    if (productQuery.isLoading) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-2/3 max-w-md" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="min-h-[12rem] flex-1 rounded-lg" />
        </div>
      );
    }
    if (productQuery.isError) {
      return (
        <DataTableError
          message={getErrorMessage(productQuery.error)}
          onRetry={() => productQuery.refetch()}
        />
      );
    }
    if (!productQuery.data) {
      return null;
    }

    const product = productQuery.data;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-base leading-snug font-semibold tracking-tight">{product.name}</p>
            <p className="text-muted-foreground font-mono text-sm">{product.sku}</p>
            {selectedRow?.packing_label ? (
              <p className="text-muted-foreground text-xs">{selectedRow.packing_label}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {detailActions?.(selectedId)}
            <Button type="button" size="sm" variant="secondary" asChild>
              <Link href={`/products/${selectedId}`}>Open item</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={`/stock/${selectedId}`}>Stock ledger</Link>
            </Button>
          </div>
        </div>

        {selectedRow ? (
          <SelectedItemSummary row={selectedRow} inquiry={inquiryQuery.data} />
        ) : null}

        <Tabs defaultValue="reg" className="flex flex-col gap-3">
          <TabsList className="bg-muted/50 h-9 w-full justify-start gap-1 p-1">
            <TabsTrigger value="reg" className="text-xs sm:text-sm">
              Reg details
            </TabsTrigger>
            {canHistory ? (
              <TabsTrigger value="sales" className="text-xs sm:text-sm">
                Sales
              </TabsTrigger>
            ) : null}
            {canHistory ? (
              <TabsTrigger value="local" className="text-xs sm:text-sm">
                Local purchase
              </TabsTrigger>
            ) : null}
            {canHistory ? (
              <TabsTrigger value="import" className="text-xs sm:text-sm">
                Import purchase
              </TabsTrigger>
            ) : null}
          </TabsList>

          <div className="pt-1">
            <TabsContent
              value="reg"
              className="mt-0 flex flex-col gap-4 focus-visible:outline-none"
            >
              <ProductInquiryPanel product={product} showStockLink={false} extended />
              <ProductQuantityRowsTable
                rows={inquiryQuery.data?.quantity_rows}
                unitCode={inquiryQuery.data?.unit_code}
                unit2Code={inquiryQuery.data?.unit2_code}
              />
            </TabsContent>
            {canHistory ? (
              <TabsContent
                value="sales"
                className="mt-0 flex flex-col gap-3 focus-visible:outline-none"
              >
                <div className="bg-muted/20 rounded-lg border px-3 py-2">
                  <DataTableToolbar className="gap-2 py-0">
                    <FilterSelect
                      label="Posting"
                      value={postingStatus}
                      onValueChange={setPostingStatus}
                      options={TRADING_HISTORY_POSTING_STATUSES.map((value) => ({
                        value,
                        label:
                          value === "ALL" ? "All" : value.charAt(0) + value.slice(1).toLowerCase(),
                      }))}
                    />
                  </DataTableToolbar>
                </div>
                <TradingHistoryLines
                  kind="product-sales"
                  ownerId={selectedId}
                  postingStatus={
                    postingStatus as (typeof TRADING_HISTORY_POSTING_STATUSES)[number]
                  }
                  documentHref={(row) => `/sales-invoices/${row.document_id}`}
                />
              </TabsContent>
            ) : null}
            {canHistory ? (
              <>
                <TabsContent
                  value="local"
                  className="mt-0 flex flex-col gap-3 focus-visible:outline-none"
                >
                  <div className="bg-muted/20 rounded-lg border px-3 py-2">
                    <DataTableToolbar className="gap-2 py-0">
                      <ListSearch
                        value={supplierName}
                        onChange={setSupplierName}
                        placeholder="Filter by supplier name…"
                        className="max-w-sm"
                      />
                    </DataTableToolbar>
                  </div>
                  <ProductPurchaseDetailsTable
                    kind="LOCAL"
                    rows={localPurchases.data?.data ?? []}
                    isLoading={localPurchases.isLoading}
                    isError={localPurchases.isError}
                    error={localPurchases.error}
                    onRetry={() => localPurchases.refetch()}
                  />
                </TabsContent>
                <TabsContent
                  value="import"
                  className="mt-0 flex flex-col gap-3 focus-visible:outline-none"
                >
                  <div className="bg-muted/20 rounded-lg border px-3 py-2">
                    <DataTableToolbar className="gap-2 py-0">
                      <ListSearch
                        value={supplierName}
                        onChange={setSupplierName}
                        placeholder="Filter by supplier name…"
                        className="max-w-sm"
                      />
                    </DataTableToolbar>
                  </div>
                  <ProductPurchaseDetailsTable
                    kind="IMPORT"
                    rows={importPurchases.data?.data ?? []}
                    isLoading={importPurchases.isLoading}
                    isError={importPurchases.isError}
                    error={importPurchases.error}
                    onRetry={() => importPurchases.refetch()}
                  />
                </TabsContent>
              </>
            ) : null}
          </div>
        </Tabs>
      </div>
    );
  }

  const lookupHint =
    totalItems != null
      ? `${totalItems} item${totalItems === 1 ? "" : "s"} · ↑ ↓`
      : "↑ ↓ keyboard · click row";

  return (
    <ListPage>
      <div className="flex flex-col gap-4">
        <PageHeader title={title} subtitle={subtitle} actions={headerActions} />

        <WorkbenchSection title="Item lookup" hint={lookupHint}>
            <DataTableToolbar className="flex-wrap gap-2">
              <ListSearch
                value={search ?? ""}
                onChange={(value) => setParams({ search: value || null })}
                placeholder="Search code, name, alias…"
                className="min-w-[12rem] flex-1"
              />
              <FilterSelect
                label="Group"
                value={categoryId}
                onValueChange={(value) =>
                  setParams({
                    filters: { ...filters, category_id: value === ALL ? null : value },
                  })
                }
                options={[
                  { value: ALL, label: "All groups" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              {columnsDialog}
              {(search || categoryId !== ALL) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParams({
                      search: null,
                      filters: {
                        category_id: null,
                      },
                    });
                  }}
                >
                  Clear
                </Button>
              )}
            </DataTableToolbar>

            {listQuery.isError ? (
              <DataTableError
                message={getErrorMessage(listQuery.error)}
                onRetry={() => listQuery.refetch()}
              />
            ) : listQuery.isLoading ? (
              <Skeleton className="h-[14rem] rounded-lg" />
            ) : (
              <>
                <ProductInventoryListGrid
                  className="max-h-[22rem]"
                  rows={rows}
                  columns={columns}
                  colSpan={colSpan}
                  selectedId={selectedId}
                  onSelect={(row) => setSelectedId(row.product_id)}
                />
                {listQuery.data?.meta ? (
                  <div className="border-t pt-2">
                    <DataTablePagination
                      meta={listQuery.data.meta}
                      onPageChange={setPage}
                      onPageSizeChange={setPageSize}
                    />
                  </div>
                ) : null}
              </>
            )}
        </WorkbenchSection>

        <WorkbenchSection
          title="Item details"
          hint={productQuery.data?.sku ?? (selectedRow?.sku || undefined)}
        >
          {renderDetailPanel()}
        </WorkbenchSection>
      </div>
    </ListPage>
  );
}
