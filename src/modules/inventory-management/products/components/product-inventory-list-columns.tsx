import type { ProductInventoryListRow } from "@/modules/inventory-management/products/schemas";
import type { DataTableColumn } from "@/shared/components/data-table/columns";
import { formatMoney, formatQuantity } from "@/shared/lib/format";

const qtyHead = "h-9 text-right text-xs font-semibold whitespace-nowrap";
const qtyCell = "py-2 text-right text-sm tabular-nums";
const textHead = "h-9 text-xs font-semibold whitespace-nowrap";
const textCell = "text-muted-foreground max-w-[8rem] truncate py-2 text-sm";
const moneyHead = "h-9 text-right text-xs font-semibold whitespace-nowrap";
const moneyCellClass = "py-2 text-right text-sm tabular-nums";

function formatQty(value: string | undefined) {
  return formatQuantity(String(value ?? "0"));
}

function formatOptionalMoney(value: string | null | undefined, code: string) {
  if (value == null || value === "") {
    return "—";
  }
  return formatMoney(value, code);
}

function formatOptionalText(value: string | null | undefined) {
  return value?.trim() || "—";
}

export function buildProductInventoryListColumnDefs(
  moneyCode: string,
): Array<DataTableColumn<ProductInventoryListRow>> {
  return [
    {
      id: "sku",
      header: "Item code",
      headerClassName: "h-9 whitespace-nowrap text-xs font-semibold",
      className: "py-2 font-mono text-xs font-medium sm:text-sm",
      cell: (row) => row.sku,
    },
    {
      id: "name",
      header: "Item name",
      headerClassName: "h-9 min-w-[11rem] text-xs font-semibold",
      className: "max-w-[14rem] truncate py-2 text-sm",
      cell: (row) => row.name,
    },
    {
      id: "net_available",
      header: "Net qty",
      headerClassName: qtyHead,
      className: qtyCell,
      cell: (row) => formatQty(row.net_available),
    },
    {
      id: "volume",
      header: "CMB",
      headerClassName: qtyHead,
      className: qtyCell,
      cell: (row) => (row.volume?.trim() ? formatQuantity(row.volume) : "—"),
    },
    {
      id: "alias_2",
      header: "Alias 2",
      defaultVisible: true,
      headerClassName: textHead,
      className: `${textCell} text-xs`,
      cell: (row) => formatOptionalText(row.alias_2),
    },
    {
      id: "alias_3",
      header: "Alias 3",
      defaultVisible: true,
      headerClassName: textHead,
      className: `${textCell} text-xs`,
      cell: (row) => formatOptionalText(row.alias_3),
    },
    {
      id: "alias_4",
      header: "Alias 4",
      defaultVisible: true,
      headerClassName: textHead,
      className: `${textCell} text-xs`,
      cell: (row) => formatOptionalText(row.alias_4),
    },
    {
      id: "qty_on_hand",
      header: "On hand",
      headerClassName: qtyHead,
      className: qtyCell,
      cell: (row) => formatQty(row.qty_on_hand),
    },
    {
      id: "shop_qty",
      header: "Shop",
      defaultVisible: true,
      headerClassName: qtyHead,
      className: qtyCell,
      cell: (row) => formatQty(row.shop_qty),
    },
    {
      id: "warehouse_qty",
      header: "W. house",
      defaultVisible: true,
      headerClassName: qtyHead,
      className: qtyCell,
      cell: (row) => formatQty(row.warehouse_qty),
    },
    {
      id: "brand",
      header: "Brand",
      defaultVisible: false,
      headerClassName: textHead,
      className: textCell,
      cell: (row) => formatOptionalText(row.brand),
    },
    {
      id: "engine",
      header: "Engine",
      defaultVisible: false,
      headerClassName: textHead,
      className: textCell,
      cell: (row) => formatOptionalText(row.engine),
    },
    {
      id: "packing_label",
      header: "Packing",
      defaultVisible: false,
      headerClassName: textHead,
      className: textCell,
      cell: (row) => formatOptionalText(row.packing_label),
    },
    {
      id: "selling_rate",
      header: "Def. sale",
      defaultVisible: false,
      headerClassName: moneyHead,
      className: moneyCellClass,
      cell: (row) => formatOptionalMoney(row.selling_rate, moneyCode),
    },
    {
      id: "price_1",
      header: "Price 1",
      defaultVisible: false,
      headerClassName: moneyHead,
      className: moneyCellClass,
      cell: (row) => formatOptionalMoney(row.price_1, moneyCode),
    },
    {
      id: "price_2",
      header: "Price 2",
      defaultVisible: false,
      headerClassName: moneyHead,
      className: moneyCellClass,
      cell: (row) => formatOptionalMoney(row.price_2, moneyCode),
    },
    {
      id: "purchase_rate",
      header: "Purchase rate",
      defaultVisible: false,
      headerClassName: moneyHead,
      className: moneyCellClass,
      cell: (row) => formatOptionalMoney(row.purchase_rate, moneyCode),
    },
    {
      id: "avg_cost",
      header: "Avg. cost",
      defaultVisible: false,
      headerClassName: moneyHead,
      className: moneyCellClass,
      cell: (row) =>
        formatOptionalMoney(row.avg_cost ?? row.purchase_rate, moneyCode),
    },
    {
      id: "last_purchase_price",
      header: "Last purchase",
      defaultVisible: false,
      headerClassName: moneyHead,
      className: moneyCellClass,
      cell: (row) => formatOptionalMoney(row.last_purchase_price, moneyCode),
    },
    {
      id: "lc_price",
      header: "LC price",
      defaultVisible: false,
      headerClassName: moneyHead,
      className: moneyCellClass,
      cell: (row) => formatOptionalMoney(row.lc_price, moneyCode),
    },
    {
      id: "ordered_qty",
      header: "Ordered",
      defaultVisible: false,
      headerClassName: qtyHead,
      className: qtyCell,
      cell: (row) => formatQty(row.ordered_qty),
    },
    {
      id: "qty_opened",
      header: "Opened",
      defaultVisible: false,
      headerClassName: qtyHead,
      className: qtyCell,
      cell: (row) => formatQty(row.qty_opened),
    },
    {
      id: "qty_committed",
      header: "Committed",
      defaultVisible: false,
      headerClassName: qtyHead,
      className: qtyCell,
      cell: (row) => formatQty(row.qty_committed),
    },
  ];
}
