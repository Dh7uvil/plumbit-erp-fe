import { OPTIONAL_SELECT_NONE } from "@/config/constants";

export type ProductLineAutofillSource = {
  name: string;
  sales_description?: string | null;
  purchase_description?: string | null;
  selling_rate?: string | null;
  purchase_rate?: string | null;
  unit_id?: string | null;
  tax_id?: string | null;
};

export function productLineAutofillValues(
  product: ProductLineAutofillSource,
  productSide: "sales" | "purchase",
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
  return {
    description,
    rate: rate ?? "",
    unit_id: product.unit_id ?? OPTIONAL_SELECT_NONE,
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
