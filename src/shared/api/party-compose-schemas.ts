import { z } from "zod";

export const CustomerDocumentComposeDefaultsSchema = z.object({
  customer_id: z.string().uuid(),
  customer_name: z.string(),
  customer_trn: z.string().nullable(),
  tax_treatment: z.string(),
  currency_id: z.string().uuid(),
  price_list_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable(),
  salesperson_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),
  warehouse_id: z.string().uuid().nullable(),
  place_of_supply: z.string(),
  bill_to_snapshot: z.string().nullable(),
  ship_to_snapshot: z.string().nullable(),
  terms_and_conditions: z.string().nullable(),
});

export type CustomerDocumentComposeDefaults = z.infer<typeof CustomerDocumentComposeDefaultsSchema>;

export const SupplierDocumentComposeDefaultsSchema = z.object({
  supplier_id: z.string().uuid(),
  supplier_name: z.string(),
  supplier_trn: z.string().nullable(),
  tax_treatment: z.string(),
  currency_id: z.string().uuid(),
  payment_terms_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),
  warehouse_id: z.string().uuid().nullable(),
  place_of_supply: z.string(),
  supplier_address_snapshot: z.string().nullable(),
  deliver_to_snapshot: z.string().nullable(),
  terms_and_conditions: z.string().nullable(),
  freight_forwarder_id: z.string().uuid().nullable().optional(),
});

export type SupplierDocumentComposeDefaults = z.infer<typeof SupplierDocumentComposeDefaultsSchema>;

export const CustomerPaymentComposeDefaultsSchema = z.object({
  customer_id: z.string().uuid(),
  currency_id: z.string().uuid(),
  receivable_account_id: z.string().uuid().nullable(),
});

export type CustomerPaymentComposeDefaults = z.infer<typeof CustomerPaymentComposeDefaultsSchema>;

export const SupplierPaymentComposeDefaultsSchema = z.object({
  supplier_id: z.string().uuid(),
  currency_id: z.string().uuid(),
  payable_account_id: z.string().uuid().nullable(),
});

export type SupplierPaymentComposeDefaults = z.infer<typeof SupplierPaymentComposeDefaultsSchema>;

export const ProductLineDefaultsSchema = z.object({
  unit_id: z.string().uuid().nullable(),
  tax_id: z.string().uuid().nullable(),
  rate: z.string().nullable(),
  available_qty: z.string().nullable().optional(),
  average_cost: z.string().nullable().optional(),
});

export type ProductLineDefaults = z.infer<typeof ProductLineDefaultsSchema>;
