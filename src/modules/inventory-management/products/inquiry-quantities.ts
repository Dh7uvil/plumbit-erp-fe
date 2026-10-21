import type {
  ProductInquiryQuantityRows,
  ProductQuantityUnitBreakdown,
} from "@/modules/inventory-management/products/schemas";

function parseDecimal(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function quantityUnitBreakdown(
  qtyRaw: string,
  factorRaw: string | null | undefined,
): ProductQuantityUnitBreakdown {
  const qty = parseDecimal(qtyRaw);
  const factor = factorRaw?.trim() ? parseDecimal(factorRaw) : 0;
  if (factor <= 0) {
    return {
      unit_qty: String(qty),
      unit2_qty: "0",
      remainder_qty: "0",
    };
  }
  const unit2Count = Math.floor(qty / factor);
  const remainder = qty - unit2Count * factor;
  return {
    unit_qty: String(qty),
    unit2_qty: String(unit2Count),
    remainder_qty: String(remainder),
  };
}

export function buildQuantityRows(input: {
  qty_on_hand: string;
  qty_opened: string;
  qty_committed: string;
  net_available: string;
  secondary_unit_factor: string | null | undefined;
}): ProductInquiryQuantityRows {
  const factor = input.secondary_unit_factor;
  return {
    on_hand: quantityUnitBreakdown(input.qty_on_hand, factor),
    opened: quantityUnitBreakdown(input.qty_opened, factor),
    committed: quantityUnitBreakdown(input.qty_committed, factor),
    net_available: quantityUnitBreakdown(input.net_available, factor),
  };
}
