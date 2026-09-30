import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  VoucherEntryFormLineSchema,
  isBlankVoucherEntryLine,
} from "@/modules/erp/accounting/vouchers/schemas";
import { journalBalanceTotals } from "@/modules/erp/accounting/journals/balance";

export const RECURRING_DOCUMENT_KINDS = [
  "SALES_INVOICE",
  "PURCHASE_INVOICE",
  "STANDING_JOURNAL",
] as const;
export type RecurringDocumentKind = (typeof RECURRING_DOCUMENT_KINDS)[number];

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
  schedule_day: z.number().int().min(1).max(31).optional().default(1),
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

export const RecurringFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(150),
    document_kind: z.enum(RECURRING_DOCUMENT_KINDS),
    frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
    interval: z.string().trim().regex(/^[1-9]\d*$/, "Interval must be at least 1"),
    next_run_date: z.string().min(1, "Choose a date"),
    end_date: z.string().optional(),
    max_runs: z.string().optional(),
    party_id: z.string(),
    product_id: z.string(),
    quantity: z.string(),
    narration: z.string(),
    currency_id: z.string(),
    branch_id: z.string(),
    cost_center_id: z.string(),
    reference: z.string(),
    lines: z.array(VoucherEntryFormLineSchema),
  })
  .superRefine((values, ctx) => {
    if (values.document_kind === "STANDING_JOURNAL") {
      if (!values.currency_id || values.currency_id === OPTIONAL_SELECT_NONE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Choose a currency",
          path: ["currency_id"],
        });
      }
      const filled = values.lines.filter((line) => !isBlankVoucherEntryLine(line));
      if (filled.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least two journal lines",
          path: ["lines"],
        });
      }
      for (const line of filled) {
        if (!line.account_id || line.account_id === OPTIONAL_SELECT_NONE) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Choose an account for each line",
            path: ["lines"],
          });
          break;
        }
      }
      const totals = journalBalanceTotals(filled);
      if (!totals.isBalanced) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Journal lines must balance",
          path: ["lines"],
        });
      }
      return;
    }
    if (!values.party_id || !z.string().uuid().safeParse(values.party_id).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a party",
        path: ["party_id"],
      });
    }
    if (!values.product_id || !z.string().uuid().safeParse(values.product_id).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a product",
        path: ["product_id"],
      });
    }
    if (!values.quantity.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantity is required",
        path: ["quantity"],
      });
    }
  });
export type RecurringFormValues = z.infer<typeof RecurringFormSchema>;

export type RecurringListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: string;
};

export function recurringDocumentKindLabel(kind: string): string {
  if (kind === "SALES_INVOICE") return "Sales invoice";
  if (kind === "PURCHASE_INVOICE") return "Purchase bill";
  if (kind === "STANDING_JOURNAL") return "Standing journal";
  return kind;
}

export function recurringDocumentHref(kind: string, id: string): string {
  if (kind === "PURCHASE_INVOICE") return `/purchase-invoices/${id}`;
  if (kind === "STANDING_JOURNAL") return `/vouchers/${id}`;
  return `/sales-invoices/${id}`;
}
