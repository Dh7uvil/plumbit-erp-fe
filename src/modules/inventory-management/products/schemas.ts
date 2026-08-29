import { z } from "zod";

import { MoneySchema } from "@/shared/lib/money";

export const ITEM_TYPES = ["PRODUCT", "SERVICE"] as const;
export const ItemTypeSchema = z.enum(ITEM_TYPES);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  PRODUCT: "Product",
  SERVICE: "Service",
};

export const ProductSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  item_type: ItemTypeSchema,
  sku: z.string(),
  name: z.string(),
  sales_description: z.string().nullable(),
  unit_id: z.string().uuid().nullable(),
  category_id: z.string().uuid().nullable(),
  selling_rate: MoneySchema,
  tax_id: z.string().uuid().nullable(),
  hs_code: z.string().nullable(),
  track_inventory: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductListSchema = z.array(ProductSchema);

export const ProductCreateRequestSchema = z.object({
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  item_type: ItemTypeSchema.optional(),
  sales_description: z.string().nullable().optional(),
  unit_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  selling_rate: MoneySchema.optional(),
  tax_id: z.string().uuid().nullable().optional(),
  hs_code: z.string().max(20).nullable().optional(),
  track_inventory: z.boolean().optional(),
});
export type ProductCreateRequest = z.infer<typeof ProductCreateRequestSchema>;

export const ProductUpdateRequestSchema = z.object({
  item_type: ItemTypeSchema.nullable().optional(),
  name: z.string().min(1).max(200).nullable().optional(),
  sales_description: z.string().nullable().optional(),
  unit_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  selling_rate: MoneySchema.nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  hs_code: z.string().max(20).nullable().optional(),
  track_inventory: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type ProductUpdateRequest = z.infer<typeof ProductUpdateRequestSchema>;

export const ProductFormSchema = z.object({
  sku: z.string().min(1, "Enter a SKU").max(80),
  name: z.string().min(1, "Enter a name").max(200),
  item_type: ItemTypeSchema,
  sales_description: z.string(),
  unit_id: z.string(),
  category_id: z.string(),
  selling_rate: z.string(),
  tax_id: z.string(),
  hs_code: z.string().max(20),
  track_inventory: z.boolean(),
  is_active: z.boolean(),
});
export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export type ProductListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  item_type?: ItemType;
  category_id?: string;
  unit_id?: string;
  tax_id?: string;
  is_active?: boolean;
};
