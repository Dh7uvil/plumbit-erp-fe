import { z } from "zod";

import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  documentTypeDisplayLabel,
  isDocumentType,
  type DocumentType,
} from "@/shared/components/document/document-links";

export { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, isDocumentType };
export type { DocumentType };

export const DocumentTypeSchema = z.enum(DOCUMENT_TYPES);

export function documentTypeLabel(value: string): string {
  return documentTypeDisplayLabel(value);
}

const INTERNAL_DOCUMENT_TYPES = new Set([
  "JOURNAL",
  "JOURNAL_ENTRY",
  "STOCK_TRANSFER",
  "STOCK_ADJUSTMENT",
  "SHIPMENT",
  "OPENING_AR",
  "OPENING_AP",
]);

export function formatSequencePreview(
  prefix: string,
  fiscalYear: number,
  nextNumber: number,
  padding: number,
  documentType?: string,
): string {
  const safeNumber = Number.isFinite(nextNumber) ? nextNumber : 1;
  const safePadding = Number.isFinite(padding) ? padding : 6;
  const year = fiscalYear || new Date().getFullYear();
  const yy = String(year % 100).padStart(2, "0");
  const seq = String(safeNumber).padStart(safePadding, "0");
  const party = documentType && INTERNAL_DOCUMENT_TYPES.has(documentType) ? "" : "XXX";
  return `${prefix || "PREFIX"}${party}${yy}${seq}`;
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
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
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
