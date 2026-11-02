import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { multiplyDecimals, proportionDecimal, QUANTITY_SCALE } from "@/shared/lib/format";

export type ProductLineUnits = {
  unit_id?: string | null;
  secondary_unit_id?: string | null;
  secondary_unit_factor?: string | null;
};

function unitCode(
  unitId: string | null | undefined,
  codeForId: (id: string) => string | undefined,
): string | undefined {
  if (!unitId || unitId === OPTIONAL_SELECT_NONE) {
    return undefined;
  }
  return codeForId(unitId)?.trim().toUpperCase();
}

/** When the user picks unit 2 (package), convert qty/rate to the product base unit. */
export function convertLineUnit2SelectionToPieces(
  product: ProductLineUnits,
  selectedUnitId: string,
  quantity: string,
  rate: string,
  codeForId: (id: string) => string | undefined = () => undefined,
): { unit_id: string; quantity: string; rate: string } | null {
  if (
    !product.unit_id ||
    !product.secondary_unit_id ||
    selectedUnitId === OPTIONAL_SELECT_NONE ||
    selectedUnitId !== product.secondary_unit_id
  ) {
    return null;
  }
  const secCode = unitCode(product.secondary_unit_id, codeForId);
  if (secCode === "PCS") {
    return { unit_id: selectedUnitId, quantity, rate };
  }
  const factorRaw = product.secondary_unit_factor?.trim();
  if (!factorRaw) {
    return null;
  }
  const factorNum = Number(factorRaw);
  if (!Number.isFinite(factorNum) || factorNum <= 0) {
    return null;
  }
  const qtyTrim = quantity.trim();
  const rateTrim = rate.trim();
  const piecesQty = qtyTrim
    ? (multiplyDecimals(qtyTrim, factorRaw, QUANTITY_SCALE) ?? quantity)
    : quantity;
  const piecesRate = rateTrim
    ? (proportionDecimal(rateTrim, factorRaw, "1") ?? rate)
    : rate;
  return {
    unit_id: product.unit_id,
    quantity: piecesQty,
    rate: piecesRate,
  };
}

export function convertQuantityUnit2ToPieces(
  product: ProductLineUnits,
  selectedUnitId: string,
  quantity: string,
  codeForId: (id: string) => string | undefined = () => undefined,
): { unit_id: string; quantity: string } | null {
  const converted = convertLineUnit2SelectionToPieces(
    product,
    selectedUnitId,
    quantity,
    "",
    codeForId,
  );
  if (!converted) {
    return null;
  }
  return { unit_id: converted.unit_id, quantity: converted.quantity };
}

export function convertUnitCostUnit2ToPieces(
  product: ProductLineUnits,
  selectedUnitId: string,
  unitCost: string,
  codeForId: (id: string) => string | undefined = () => undefined,
): string | null {
  const secCode = unitCode(product.secondary_unit_id, codeForId);
  if (secCode === "PCS") {
    return unitCost;
  }
  const factorRaw = product.secondary_unit_factor?.trim();
  if (
    !product.secondary_unit_id ||
    selectedUnitId !== product.secondary_unit_id ||
    !factorRaw
  ) {
    return null;
  }
  const trimmed = unitCost.trim();
  if (!trimmed) {
    return unitCost;
  }
  return proportionDecimal(trimmed, factorRaw, "1");
}
