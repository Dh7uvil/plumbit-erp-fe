import { z } from "zod";

export const DOCUMENT_TYPES = [
  "QUOTATION",
  "SALES_ORDER",
  "DELIVERY_NOTE",
  "SALES_INVOICE",
  "CREDIT_NOTE",
  "PURCHASE_ORDER",
  "GOODS_RECEIPT",
  "PURCHASE_INVOICE",
  "DEBIT_NOTE",
] as const;
export const DocumentTypeSchema = z.enum(DOCUMENT_TYPES);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  QUOTATION: "Quotation",
  SALES_ORDER: "Sales order",
  DELIVERY_NOTE: "Delivery note",
  SALES_INVOICE: "Sales invoice",
  CREDIT_NOTE: "Credit note",
  PURCHASE_ORDER: "Purchase order",
  GOODS_RECEIPT: "Goods receipt",
  PURCHASE_INVOICE: "Purchase invoice",
  DEBIT_NOTE: "Debit note",
};

export function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function documentTypeLabel(value: string): string {
  return isDocumentType(value) ? DOCUMENT_TYPE_LABELS[value] : value;
}

export const DocumentSequenceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_type: z.string(),
  series: z.string(),
  fiscal_year: z.number().int(),
  prefix: z.string(),
  next_number: z.number().int(),
  padding: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DocumentSequence = z.infer<typeof DocumentSequenceSchema>;

export const DocumentSequenceListSchema = z.array(DocumentSequenceSchema);

export const DocumentSequenceCreateRequestSchema = z.object({
  document_type: DocumentTypeSchema,
  series: z.string().min(1).max(20),
  fiscal_year: z.number().int().min(2000).max(2100),
  prefix: z.string().min(1).max(20),
  next_number: z.number().int().min(1).optional(),
  padding: z.number().int().min(1).max(10).optional(),
});
export type DocumentSequenceCreateRequest = z.infer<typeof DocumentSequenceCreateRequestSchema>;

export const DocumentSequenceUpdateRequestSchema = z.object({
  prefix: z.string().min(1).max(20).nullable().optional(),
  next_number: z.number().int().min(1).nullable().optional(),
  padding: z.number().int().min(1).max(10).nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type DocumentSequenceUpdateRequest = z.infer<typeof DocumentSequenceUpdateRequestSchema>;

export const DocumentSequenceFormSchema = z.object({
  document_type: DocumentTypeSchema,
  series: z.string().min(1, "Enter a series").max(20),
  fiscal_year: z.number().int().min(2000).max(2100),
  prefix: z.string().min(1, "Enter a prefix").max(20),
  next_number: z.number().int().min(1),
  padding: z.number().int().min(1).max(10),
  is_active: z.boolean(),
});
export type DocumentSequenceFormValues = z.infer<typeof DocumentSequenceFormSchema>;

export type DocumentSequenceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
