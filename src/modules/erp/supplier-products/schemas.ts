import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { MoneySchema } from "@/shared/lib/money";

export const SUPPLIER_SKU_RESOLVE_STATUSES = ["MAPPED", "UNMAPPED", "UNKNOWN_SKU"] as const;
export const SupplierSkuResolveStatusSchema = z.enum(SUPPLIER_SKU_RESOLVE_STATUSES);
export type SupplierSkuResolveStatus = z.infer<typeof SupplierSkuResolveStatusSchema>;

export const SupplierProductSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  supplier_name: z.string().nullable(),
  product_id: z.string().uuid().nullable(),
  product_sku: z.string().nullable(),
  product_name: z.string().nullable(),
  is_mapped: z.boolean(),
  supplier_sku: z.string(),
  supplier_item_name: z.string(),
  supplier_description: z.string().nullable(),
  price: MoneySchema.nullable(),
  currency_id: z.string().uuid(),
  currency_code: z.string().nullable(),
  price_updated_at: z.string().nullable(),
  is_preferred: z.boolean(),
  is_preferred_supplier: z.boolean(),
  notes: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SupplierProduct = z.infer<typeof SupplierProductSchema>;

export const SupplierProductListSchema = z.array(SupplierProductSchema);

export const SupplierProductCreateRequestSchema = z.object({
  supplier_id: z.string().uuid(),
  product_id: z.string().uuid().nullable().optional(),
  supplier_sku: z.string().min(1).max(80),
  supplier_item_name: z.string().min(1).max(200),
  supplier_description: z.string().nullable().optional(),
  price: MoneySchema.nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  is_preferred: z.boolean().optional(),
  is_preferred_supplier: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});
export type SupplierProductCreateRequest = z.infer<typeof SupplierProductCreateRequestSchema>;

export const SupplierProductUpdateRequestSchema = z.object({
  supplier_sku: z.string().min(1).max(80).nullable().optional(),
  supplier_item_name: z.string().min(1).max(200).nullable().optional(),
  supplier_description: z.string().nullable().optional(),
  price: MoneySchema.nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  is_preferred: z.boolean().nullable().optional(),
  is_preferred_supplier: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type SupplierProductUpdateRequest = z.infer<typeof SupplierProductUpdateRequestSchema>;

export const SupplierProductLinkRequestSchema = z.object({
  product_id: z.string().uuid(),
});
export type SupplierProductLinkRequest = z.infer<typeof SupplierProductLinkRequestSchema>;

export const SupplierProductResolveBatchRequestSchema = z.object({
  supplier_id: z.string().uuid(),
  supplier_skus: z.array(z.string()).min(1).max(200),
});
export type SupplierProductResolveBatchRequest = z.infer<
  typeof SupplierProductResolveBatchRequestSchema
>;

export const SupplierProductResolveSchema = z.object({
  supplier_sku: z.string(),
  status: SupplierSkuResolveStatusSchema,
  supplier_product_id: z.string().uuid().nullable().optional().default(null),
  product_id: z.string().uuid().nullable().optional().default(null),
  product_sku: z.string().nullable().optional().default(null),
  product_name: z.string().nullable().optional().default(null),
});
export type SupplierProductResolve = z.infer<typeof SupplierProductResolveSchema>;

export const SupplierProductResolveListSchema = z.array(SupplierProductResolveSchema);

export const SupplierProductFormSchema = z.object({
  supplier_id: z
    .string()
    .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a supplier"),
  product_id: z.string(),
  supplier_sku: z.string().min(1, "Enter a supplier SKU").max(80),
  supplier_item_name: z.string().min(1, "Enter an item name").max(200),
  supplier_description: z.string(),
  price: z.string(),
  currency_id: z.string(),
  is_preferred: z.boolean(),
  is_preferred_supplier: z.boolean(),
  notes: z.string(),
  is_active: z.boolean(),
});
export type SupplierProductFormValues = z.infer<typeof SupplierProductFormSchema>;

export type SupplierProductListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  supplier_id?: string;
  product_id?: string;
  mapped?: boolean;
  is_active?: boolean;
  is_preferred?: boolean;
  is_preferred_supplier?: boolean;
};
