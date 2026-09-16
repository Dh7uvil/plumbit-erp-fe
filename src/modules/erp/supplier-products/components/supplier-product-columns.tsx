"use client";

import type { ReactNode } from "react";

import type { SupplierProduct } from "@/modules/erp/supplier-products/schemas";
import {
  auditActorColumns,
  auditTimestampColumns,
} from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  omitColumnIds,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { Badge } from "@/shared/components/ui/badge";
import { formatDateTime, formatMoney } from "@/shared/lib/format";

export function MappedProductCell({ row }: { row: SupplierProduct }) {
  if (!row.is_mapped || !row.product_id) {
    return <Badge variant="warning">Unmapped</Badge>;
  }
  return (
    <RecordLink href={`/products/${row.product_id}`}>
      {row.product_sku ? `${row.product_sku} — ${row.product_name}` : (row.product_name ?? "—")}
    </RecordLink>
  );
}

export function PreferredBadges({ row }: { row: SupplierProduct }) {
  if (!row.is_preferred && !row.is_preferred_supplier) {
    return "—";
  }
  return (
    <div className="flex flex-wrap gap-1">
      {row.is_preferred ? <Badge variant="info">Preferred SKU</Badge> : null}
      {row.is_preferred_supplier ? <Badge variant="info">Preferred supplier</Badge> : null}
    </div>
  );
}

export function supplierProductColumnDefs({
  userNameById,
  actions,
  omit = [],
}: {
  userNameById: Map<string, string>;
  actions?: (row: SupplierProduct) => ReactNode;
  omit?: readonly string[];
}): Array<DataTableColumn<SupplierProduct>> {
  return omitColumnIds(
    [
      {
        id: "supplier_sku",
        header: "Supplier SKU",
        sortableField: "supplier_sku",
        className: "font-mono text-sm",
        cell: (row) => (
          <RecordLink href={`/supplier-products/${row.id}`}>{row.supplier_sku}</RecordLink>
        ),
      },
      {
        id: "supplier_item",
        header: "Supplier item",
        sortableField: "supplier_item_name",
        cell: (row) => (
          <RecordLink href={`/supplier-products/${row.id}`}>{row.supplier_item_name}</RecordLink>
        ),
      },
      {
        id: "supplier",
        header: "Supplier",
        className: "font-medium",
        cell: (row) => (
          <RecordLink href={`/suppliers/${row.supplier_id}`}>{row.supplier_name ?? "—"}</RecordLink>
        ),
      },
      {
        id: "mapped_product",
        header: "Mapped product",
        cell: (row) => <MappedProductCell row={row} />,
      },
      {
        id: "price",
        header: "Price",
        cell: (row) =>
          row.price && row.currency_code ? formatMoney(row.price, row.currency_code) : "—",
      },
      {
        id: "is_preferred",
        header: "Preferred",
        cell: (row) => <PreferredBadges row={row} />,
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
      {
        id: "currency_code",
        header: "Currency",
        defaultVisible: false,
        cell: (row) => row.currency_code || "—",
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (row) => row.notes || "—",
      },
      {
        id: "price_updated_at",
        header: "Price updated",
        defaultVisible: false,
        className: "text-muted-foreground text-xs",
        cell: (row) => formatDateTime(row.price_updated_at),
      },
      ...auditTimestampColumns<SupplierProduct>(),
      ...auditActorColumns<SupplierProduct>(userNameById),
      ...actionsColumn<SupplierProduct>(Boolean(actions), (row) => actions?.(row)),
    ],
    omit,
  );
}
