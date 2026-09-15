"use client";

import { useAllCategories } from "@/modules/inventory-management/categories/queries";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

const ALL = "all";

export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function InventoryReportFilters({
  asOf,
  from,
  to,
  warehouseId,
  productId,
  categoryId,
  onChange,
}: {
  asOf?: string;
  from?: string;
  to?: string;
  warehouseId?: string;
  productId?: string;
  categoryId?: string;
  onChange: (patch: Record<string, string | null>) => void;
}) {
  const warehousesQuery = useAllWarehouses();
  const productsQuery = useAllProducts();
  const categoriesQuery = useAllCategories();
  const warehouses = warehousesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const hasFilters = Boolean(from || to || warehouseId || productId || categoryId);

  return (
    <>
      {asOf !== undefined ? (
        <ToolbarControl label="As of" htmlFor="report-as-of">
          <Input
            id="report-as-of"
            type="date"
            value={asOf}
            onChange={(event) => onChange({ as_of: event.target.value || null })}
          />
        </ToolbarControl>
      ) : null}
      {from !== undefined && to !== undefined ? (
        <DateRangeFilter
          layout="inline"
          fromId="report-from"
          toId="report-to"
          from={from}
          to={to}
          onFromChange={(value) => onChange({ from: value || null })}
          onToChange={(value) => onChange({ to: value || null })}
        />
      ) : null}
      <FilterSelect
        label="Warehouse"
        className="w-48"
        placeholder="Warehouse"
        value={warehouseId ?? ALL}
        onValueChange={(value) => onChange({ warehouse_id: value === ALL ? null : value })}
        options={[
          { value: ALL, label: "All warehouses" },
          ...warehouses.map((warehouse) => ({
            value: warehouse.id,
            label: `${warehouse.code} — ${warehouse.name}`,
          })),
        ]}
      />
      <FilterSelect
        label="Category"
        className="w-48"
        placeholder="Category"
        value={categoryId ?? ALL}
        onValueChange={(value) => onChange({ category_id: value === ALL ? null : value })}
        options={[
          { value: ALL, label: "All categories" },
          ...categories.map((category) => ({ value: category.id, label: category.name })),
        ]}
      />
      <FilterSelect
        label="Product"
        className="w-56"
        placeholder="Product"
        value={productId ?? ALL}
        onValueChange={(value) => onChange({ product_id: value === ALL ? null : value })}
        options={[
          { value: ALL, label: "All products" },
          ...products.map((product) => ({
            value: product.id,
            label: `${product.sku} — ${product.name}`,
          })),
        ]}
      />
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() =>
            onChange({
              as_of: null,
              from: null,
              to: null,
              warehouse_id: null,
              product_id: null,
              category_id: null,
            })
          }
        >
          Clear
        </Button>
      ) : null}
    </>
  );
}
