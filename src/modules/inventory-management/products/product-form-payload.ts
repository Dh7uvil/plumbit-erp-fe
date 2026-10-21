import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import type {
  Product,
  ProductCreateRequest,
  ProductFormValues,
  ProductUpdateRequest,
} from "@/modules/inventory-management/products/schemas";
import { PRODUCT_FORM_UPDATE_KEYS } from "@/modules/inventory-management/products/schemas";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function piecesPerUnitPayload(unitId: string, piecesPerUnit: string): string | null {
  return optionalUuid(unitId) ? emptyToNull(piecesPerUnit) : null;
}

function optionalDecimal(value: string): string | null {
  return emptyToNull(value);
}

export function toFormValues(product: Product | null): ProductFormValues {
  return {
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    item_type: product?.item_type ?? "PRODUCT",
    sales_description: product?.sales_description ?? "",
    unit_id: product?.unit_id ?? OPTIONAL_SELECT_NONE,
    pieces_per_unit: product?.pieces_per_unit ?? "",
    category_id: product?.category_id ?? OPTIONAL_SELECT_NONE,
    selling_rate: product?.selling_rate ?? "0",
    purchase_rate: product?.purchase_rate ?? "0",
    price_1: product?.price_1 ?? "0",
    price_2: product?.price_2 ?? "0",
    purchase_description: product?.purchase_description ?? "",
    tax_id: product?.tax_id ?? OPTIONAL_SELECT_NONE,
    income_account_id: product?.income_account_id ?? OPTIONAL_SELECT_NONE,
    purchase_account_id: product?.purchase_account_id ?? OPTIONAL_SELECT_NONE,
    hs_code: product?.hs_code ?? "",
    volume: product?.volume ?? "",
    brand: product?.brand ?? "",
    origin_country_code: product?.origin_country_code ?? "",
    engine: product?.engine ?? "",
    alias_2: product?.alias_2 ?? "",
    alias_3: product?.alias_3 ?? "",
    alias_4: product?.alias_4 ?? "",
    rem: product?.rem ?? "",
    remarks: product?.remarks ?? "",
    max_level: product?.max_level ?? "",
    default_reorder_level: product?.default_reorder_level ?? "",
    net_weight: product?.net_weight ?? "",
    gross_weight: product?.gross_weight ?? "",
    stock_input_disabled: product?.stock_input_disabled ?? false,
    secondary_unit_id: product?.secondary_unit_id ?? OPTIONAL_SELECT_NONE,
    secondary_unit_factor: product?.secondary_unit_factor ?? "",
    track_inventory: product?.track_inventory ?? true,
    requires_qc: product?.requires_qc ?? false,
    is_active: product?.is_active ?? true,
  };
}

function winsoftPayload(values: ProductFormValues) {
  return {
    brand: emptyToNull(values.brand),
    origin_country_code: emptyToNull(values.origin_country_code)?.toUpperCase() ?? null,
    engine: emptyToNull(values.engine),
    alias_2: emptyToNull(values.alias_2),
    alias_3: emptyToNull(values.alias_3),
    alias_4: emptyToNull(values.alias_4),
    rem: emptyToNull(values.rem),
    remarks: emptyToNull(values.remarks),
    max_level: optionalDecimal(values.max_level),
    default_reorder_level: optionalDecimal(values.default_reorder_level),
    net_weight: optionalDecimal(values.net_weight),
    gross_weight: optionalDecimal(values.gross_weight),
    price_1: values.price_1.trim() || "0",
    price_2: values.price_2.trim() || "0",
    stock_input_disabled: values.stock_input_disabled,
    secondary_unit_id: optionalUuid(values.secondary_unit_id),
    secondary_unit_factor: optionalUuid(values.secondary_unit_id)
      ? optionalDecimal(values.secondary_unit_factor)
      : null,
  };
}

export function toCreateRequest(values: ProductFormValues): ProductCreateRequest {
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    item_type: values.item_type,
    sales_description: emptyToNull(values.sales_description),
    unit_id: optionalUuid(values.unit_id),
    pieces_per_unit: piecesPerUnitPayload(values.unit_id, values.pieces_per_unit),
    category_id: optionalUuid(values.category_id),
    selling_rate: values.selling_rate.trim() || "0",
    purchase_rate: values.purchase_rate.trim() || "0",
    purchase_description: emptyToNull(values.purchase_description),
    tax_id: optionalUuid(values.tax_id),
    income_account_id: optionalUuid(values.income_account_id) ?? undefined,
    purchase_account_id: optionalUuid(values.purchase_account_id) ?? undefined,
    hs_code: emptyToNull(values.hs_code),
    volume: optionalDecimal(values.volume),
    track_inventory: values.track_inventory,
    requires_qc: values.requires_qc,
    ...winsoftPayload(values),
  };
}

export function toFullUpdateRequest(values: ProductFormValues): ProductUpdateRequest {
  return {
    item_type: values.item_type,
    name: values.name.trim(),
    sales_description: emptyToNull(values.sales_description),
    unit_id: optionalUuid(values.unit_id),
    pieces_per_unit: piecesPerUnitPayload(values.unit_id, values.pieces_per_unit),
    category_id: optionalUuid(values.category_id),
    selling_rate: values.selling_rate.trim() || "0",
    purchase_rate: values.purchase_rate.trim() || "0",
    purchase_description: emptyToNull(values.purchase_description),
    tax_id: optionalUuid(values.tax_id),
    income_account_id: optionalUuid(values.income_account_id),
    purchase_account_id: optionalUuid(values.purchase_account_id),
    hs_code: emptyToNull(values.hs_code),
    volume: optionalDecimal(values.volume),
    track_inventory: values.track_inventory,
    requires_qc: values.requires_qc,
    is_active: values.is_active,
    ...winsoftPayload(values),
  };
}

export function toDirtyUpdateRequest(
  values: ProductFormValues,
  dirtyFields: Partial<Record<keyof ProductFormValues, boolean | object>>,
): ProductUpdateRequest {
  const full = toFullUpdateRequest(values);
  const patch: ProductUpdateRequest = {};
  for (const key of PRODUCT_FORM_UPDATE_KEYS) {
    if (key === "purchase_rate") {
      continue;
    }
    if (dirtyFields[key]) {
      (patch as Record<string, unknown>)[key] = full[key as keyof ProductUpdateRequest];
    }
  }
  return patch;
}
