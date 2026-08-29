import { z } from "zod";

export const ContactSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  is_primary: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const ContactListSchema = z.array(ContactSchema);

export const ContactCreateRequestSchema = z.object({
  customer_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  is_primary: z.boolean().optional(),
});
export type ContactCreateRequest = z.infer<typeof ContactCreateRequestSchema>;

export const ContactUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  is_primary: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type ContactUpdateRequest = z.infer<typeof ContactUpdateRequestSchema>;

export const ContactFormSchema = z.object({
  customer_id: z.string().uuid("Select a customer"),
  name: z.string().min(1, "Enter a name").max(200),
  email: z.string().max(255),
  phone: z.string().max(50),
  is_primary: z.boolean(),
  is_active: z.boolean(),
});
export type ContactFormValues = z.infer<typeof ContactFormSchema>;

export type ContactListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  customer_id?: string;
  is_primary?: boolean;
  is_active?: boolean;
};
