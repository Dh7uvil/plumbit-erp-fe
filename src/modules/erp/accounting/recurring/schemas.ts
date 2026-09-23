import { z } from "zod";

export const RecurringGenerationSchema = z.object({
  id: z.string().uuid(),
  run_date: z.string(),
  document_kind: z.string(),
  document_id: z.string().uuid().nullable().optional().default(null),
  document_number: z.string().nullable().optional().default(null),
});

export const RecurringTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  document_kind: z.string(),
  frequency: z.string(),
  interval: z.number(),
  next_run_date: z.string(),
  end_date: z.string().nullable().optional().default(null),
  max_occurrences: z.number().nullable().optional().default(null),
  occurrences_generated: z.number(),
  status: z.string(),
  version: z.number(),
  last_document_id: z.string().uuid().nullable().optional().default(null),
  last_document_number: z.string().nullable().optional().default(null),
  generations: z.array(RecurringGenerationSchema).optional().default([]),
  available_actions: z.array(z.string()).optional().default([]),
});
export type RecurringTemplate = z.infer<typeof RecurringTemplateSchema>;
export const RecurringTemplateListSchema = z.array(RecurringTemplateSchema);

export const RecurringFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  document_kind: z.enum(["SALES_INVOICE", "PURCHASE_INVOICE"]),
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  next_run_date: z.string().min(1, "Choose a date"),
  party_id: z.string().uuid("Choose a party"),
  product_id: z.string().uuid("Choose a product"),
  quantity: z.string().trim().min(1, "Quantity is required"),
});
export type RecurringFormValues = z.infer<typeof RecurringFormSchema>;

export type RecurringListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
};
