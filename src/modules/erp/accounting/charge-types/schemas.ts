import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";

export const CHARGE_ALLOCATION_METHODS = ["VALUE", "WEIGHT", "QUANTITY", "VOLUME"] as const;
export type ChargeAllocationMethod = (typeof CHARGE_ALLOCATION_METHODS)[number];

export const CHARGE_ALLOCATION_METHOD_LABELS: Record<ChargeAllocationMethod, string> = {
  VALUE: "Value",
  WEIGHT: "Weight",
  QUANTITY: "Quantity",
  VOLUME: "Volume",
};

export const ChargeAppliesToSchema = z.enum(["IMPORT", "EXPORT", "BOTH"]);

export const ChargeTypeSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  sort_order: z.number().int(),
  is_inventoriable: z.boolean(),
  default_account_id: z.string().uuid(),
  allocation_basis: z.enum(CHARGE_ALLOCATION_METHODS).nullable(),
  default_tax_id: z.string().uuid().nullable(),
  applies_to: ChargeAppliesToSchema,
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ChargeType = z.infer<typeof ChargeTypeSchema>;

export const ChargeTypeListSchema = z.array(ChargeTypeSchema);

export const CHARGE_APPLIES_TO_LABELS = {
  IMPORT: "Import",
  EXPORT: "Export",
  BOTH: "Import & export",
} as const;

export const ChargeTypeCreateRequestSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(150),
  sort_order: z.number().int().min(0).optional().default(0),
  is_inventoriable: z.boolean(),
  default_account_id: z.string().uuid(),
  allocation_basis: z.enum(CHARGE_ALLOCATION_METHODS).nullable().optional(),
  default_tax_id: z.string().uuid().nullable().optional(),
  applies_to: ChargeAppliesToSchema.optional().default("BOTH"),
});
export type ChargeTypeCreateRequest = z.infer<typeof ChargeTypeCreateRequestSchema>;

export const ChargeTypeUpdateRequestSchema = z.object({
  code: z.string().min(1).max(40).nullable().optional(),
  name: z.string().min(1).max(150).nullable().optional(),
  sort_order: z.number().int().min(0).nullable().optional(),
  is_inventoriable: z.boolean().nullable().optional(),
  default_account_id: z.string().uuid().nullable().optional(),
  allocation_basis: z.enum(CHARGE_ALLOCATION_METHODS).nullable().optional(),
  default_tax_id: z.string().uuid().nullable().optional(),
  applies_to: ChargeAppliesToSchema.nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type ChargeTypeUpdateRequest = z.infer<typeof ChargeTypeUpdateRequestSchema>;

export const ChargeTypeFormSchema = z.object({
  code: z.string().min(1, "Enter a code").max(40),
  name: z.string().min(1, "Enter a name").max(150),
  sort_order: z.string(),
  is_inventoriable: z.boolean(),
  default_account_id: z.string(),
  allocation_basis: z.string(),
  default_tax_id: z.string(),
  applies_to: ChargeAppliesToSchema,
  is_active: z.boolean(),
});
export type ChargeTypeFormValues = z.infer<typeof ChargeTypeFormSchema>;

export function emptyChargeTypeFormValues(): ChargeTypeFormValues {
  return {
    code: "",
    name: "",
    sort_order: "0",
    is_inventoriable: false,
    default_account_id: OPTIONAL_SELECT_NONE,
    allocation_basis: OPTIONAL_SELECT_NONE,
    default_tax_id: OPTIONAL_SELECT_NONE,
    applies_to: "BOTH",
    is_active: true,
  };
}

export type ChargeTypeListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
