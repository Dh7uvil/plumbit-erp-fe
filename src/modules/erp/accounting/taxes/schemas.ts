import { z } from "zod";

import { MoneySchema } from "@/shared/lib/money";

export const TAX_CATEGORIES = ["STANDARD", "ZERO_RATED", "EXEMPT", "OUT_OF_SCOPE"] as const;
export const TaxCategorySchema = z.enum(TAX_CATEGORIES);
export type TaxCategory = z.infer<typeof TaxCategorySchema>;

export const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  STANDARD: "Standard",
  ZERO_RATED: "Zero rated",
  EXEMPT: "Exempt",
  OUT_OF_SCOPE: "Out of scope",
};

export const TaxSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  tax_category: TaxCategorySchema,
  rate: MoneySchema,
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Tax = z.infer<typeof TaxSchema>;

export const TaxListSchema = z.array(TaxSchema);

export const TaxCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  tax_category: TaxCategorySchema,
  rate: MoneySchema,
  is_default: z.boolean().optional(),
});
export type TaxCreateRequest = z.infer<typeof TaxCreateRequestSchema>;

export const TaxUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  tax_category: TaxCategorySchema.nullable().optional(),
  rate: MoneySchema.nullable().optional(),
  is_default: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type TaxUpdateRequest = z.infer<typeof TaxUpdateRequestSchema>;

export const TaxFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  tax_category: TaxCategorySchema,
  rate: z.string().min(1, "Enter a rate"),
  is_default: z.boolean(),
  is_active: z.boolean(),
});
export type TaxFormValues = z.infer<typeof TaxFormSchema>;

export type TaxListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
