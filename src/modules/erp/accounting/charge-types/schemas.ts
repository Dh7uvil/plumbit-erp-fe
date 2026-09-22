import { z } from "zod";

export const LANDED_COST_ALLOCATION_METHODS = ["VALUE", "WEIGHT", "QUANTITY", "VOLUME"] as const;

export const ChargeAppliesToSchema = z.enum(["IMPORT", "EXPORT", "BOTH"]);

export const ChargeTypeSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  sort_order: z.number().int(),
  is_inventoriable: z.boolean(),
  default_account_id: z.string().uuid(),
  allocation_basis: z.enum(LANDED_COST_ALLOCATION_METHODS).nullable(),
  default_tax_id: z.string().uuid().nullable(),
  applies_to: ChargeAppliesToSchema,
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ChargeType = z.infer<typeof ChargeTypeSchema>;

export const ChargeTypeListSchema = z.array(ChargeTypeSchema);

export const ChargeTypeUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  sort_order: z.number().int().min(0).nullable().optional(),
  is_inventoriable: z.boolean().nullable().optional(),
  default_account_id: z.string().uuid().nullable().optional(),
  allocation_basis: z.enum(LANDED_COST_ALLOCATION_METHODS).nullable().optional(),
  default_tax_id: z.string().uuid().nullable().optional(),
  applies_to: ChargeAppliesToSchema.nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type ChargeTypeUpdateRequest = z.infer<typeof ChargeTypeUpdateRequestSchema>;

export type ChargeTypeListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
