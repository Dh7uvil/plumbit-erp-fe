import { z } from "zod";

export const PaymentTermSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  days: z.number().int(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PaymentTerm = z.infer<typeof PaymentTermSchema>;

export const PaymentTermListSchema = z.array(PaymentTermSchema);

export const PaymentTermCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  days: z.number().int().min(0).max(3650),
  description: z.string().nullable().optional(),
});
export type PaymentTermCreateRequest = z.infer<typeof PaymentTermCreateRequestSchema>;

export const PaymentTermUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  days: z.number().int().min(0).max(3650).nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type PaymentTermUpdateRequest = z.infer<typeof PaymentTermUpdateRequestSchema>;

export const PaymentTermFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  days: z.number().int().min(0).max(3650),
  description: z.string(),
  is_active: z.boolean(),
});
export type PaymentTermFormValues = z.infer<typeof PaymentTermFormSchema>;

export type PaymentTermListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
