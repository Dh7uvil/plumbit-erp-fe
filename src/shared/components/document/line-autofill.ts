import { OPTIONAL_SELECT_NONE } from "@/config/constants";

export type ProductLineAutofillSource = {
  name: string;
  sales_description?: string | null;
  purchase_description?: string | null;
  selling_rate?: string | null;
  purchase_rate?: string | null;
  unit_id?: string | null;
  secondary_unit_id?: string | null;
  tax_id?: string | null;
};

function isPiecesUnitCode(code: string | undefined): boolean {
  return (code ?? "").trim().toUpperCase() === "PCS";
}

/** Prefer pieces on new lines when the product defines unit 2 as PCS. */
export function defaultDocumentLineUnitId(
  product: Pick<ProductLineAutofillSource, "unit_id" | "secondary_unit_id">,
  codeForId: (unitId: string) => string | undefined,
): string {
  const secondaryId = product.secondary_unit_id?.trim();
  if (secondaryId && secondaryId !== OPTIONAL_SELECT_NONE) {
    if (isPiecesUnitCode(codeForId(secondaryId))) {
      return secondaryId;
    }
  }
  const baseId = product.unit_id?.trim();
  if (baseId && baseId !== OPTIONAL_SELECT_NONE && isPiecesUnitCode(codeForId(baseId))) {
    return baseId;
  }
  return product.unit_id ?? OPTIONAL_SELECT_NONE;
}

export function productLineAutofillValues(
  product: ProductLineAutofillSource,
  productSide: "sales" | "purchase",
  options?: {
    codeForUnitId?: (unitId: string) => string | undefined;
  },
): {
  description: string;
  rate: string;
  unit_id: string;
  tax_id: string;
} {
  const description =
    productSide === "purchase"
      ? product.purchase_description?.trim() || product.name
      : product.sales_description?.trim() || product.name;
  const rate = productSide === "purchase" ? product.purchase_rate : product.selling_rate;
  const unit_id = options?.codeForUnitId
    ? defaultDocumentLineUnitId(product, options.codeForUnitId)
    : (product.unit_id ?? OPTIONAL_SELECT_NONE);
  return {
    description,
    rate: rate ?? "",
    unit_id,
    tax_id: product.tax_id ?? OPTIONAL_SELECT_NONE,
  };
}

export function mergeProductLineDefaults(
  base: ReturnType<typeof productLineAutofillValues>,
  defaults: { rate?: string | null; unit_id?: string | null; tax_id?: string | null },
): ReturnType<typeof productLineAutofillValues> {
  return {
    ...base,
    rate: defaults.rate?.trim() ? defaults.rate : base.rate,
    unit_id: defaults.unit_id ?? base.unit_id,
    tax_id: defaults.tax_id ?? base.tax_id,
  };
}
