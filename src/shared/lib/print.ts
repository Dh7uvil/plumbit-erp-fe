import { z } from "zod";

import { apiClient } from "@/shared/api/client";
import { MoneySchema } from "@/shared/lib/money";

export const PrintLetterheadSchema = z.object({
  company_name: z.string(),
  company_code: z.string().optional().default(""),
  trn: z.string().nullable().optional().default(null),
  phone: z.string().nullable().optional().default(null),
  email: z.string().nullable().optional().default(null),
  website: z.string().nullable().optional().default(null),
  address: z.string().nullable().optional().default(null),
  logo_url: z.string().nullable().optional().default(null),
  bank_details: z.string().nullable().optional().default(null),
  default_currency: z.string().nullable().optional().default(null),
});
export type PrintLetterhead = z.infer<typeof PrintLetterheadSchema>;

export const PrintLineSchema = z.object({
  line_number: z.number().int(),
  item_code: z.string().nullable().optional().default(null),
  description: z.string(),
  packing_unit: z.string().nullable().optional().default(null),
  carton_qty: z.string().nullable().optional().default(null),
  quantity: z.string(),
  unit_price: MoneySchema.nullable().optional().default(null),
  taxable_amount: MoneySchema.nullable().optional().default(null),
  tax_rate: MoneySchema.nullable().optional().default(null),
  tax_amount: MoneySchema.nullable().optional().default(null),
  amount: MoneySchema.nullable().optional().default(null),
  cbm: z.string().nullable().optional().default(null),
  weight: z.string().nullable().optional().default(null),
  remarks: z.string().nullable().optional().default(null),
});
export type PrintLine = z.infer<typeof PrintLineSchema>;

export const PrintDocumentSchema = z.object({
  document_type: z.string(),
  document_id: z.string().uuid(),
  document_number: z.string(),
  document_date: z.string(),
  template_family: z.string().optional().default("uae"),
  customer_code: z.string().nullable().optional().default(null),
  customer_name: z.string().nullable().optional().default(null),
  customer_address: z.string().nullable().optional().default(null),
  customer_trn: z.string().nullable().optional().default(null),
  lpo_number: z.string().nullable().optional().default(null),
  delivery_note_number: z.string().nullable().optional().default(null),
  invoice_number: z.string().nullable().optional().default(null),
  bl_number: z.string().nullable().optional().default(null),
  container_number: z.string().nullable().optional().default(null),
  incoterm: z.string().nullable().optional().default(null),
  incoterm_place: z.string().nullable().optional().default(null),
  currency_code: z.string().nullable().optional().default(null),
  subtotal: MoneySchema.nullable().optional().default(null),
  tax_amount: MoneySchema.nullable().optional().default(null),
  grand_total: MoneySchema.nullable().optional().default(null),
  amount_in_words: z.string().nullable().optional().default(null),
  payment_terms: z.string().nullable().optional().default(null),
  notes: z.string().nullable().optional().default(null),
  letterhead: PrintLetterheadSchema,
  lines: z.array(PrintLineSchema).optional().default([]),
});
export type PrintDocument = z.infer<typeof PrintDocumentSchema>;

export const PRINTABLE_RESOURCES = [
  "quotations",
  "proforma-invoices",
  "sales-invoices",
  "delivery-notes",
  "packages",
  "credit-notes",
  "debit-notes",
  "purchase-orders",
  "purchase-invoices",
  "goods-receipts",
] as const;
export type PrintableResource = (typeof PRINTABLE_RESOURCES)[number];

export function isPrintableResource(value: string): value is PrintableResource {
  return (PRINTABLE_RESOURCES as readonly string[]).includes(value);
}

export const printApi = {
  get: async (
    resource: PrintableResource,
    id: string,
    templateFamily: string = "uae",
  ): Promise<PrintDocument> =>
    PrintDocumentSchema.parse(
      await apiClient.get(`/${resource}/${id}/print`, {
        params: { template_family: templateFamily },
      }),
    ),
};

export function printHref(resource: PrintableResource, id: string, family: string = "uae"): string {
  return `/print/${resource}/${id}?family=${encodeURIComponent(family)}`;
}
