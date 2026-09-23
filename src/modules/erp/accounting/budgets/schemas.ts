import { z } from "zod";

import { DecimalStringSchema } from "@/shared/lib/money";

export const BudgetLineSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  period_start: z.string(),
  amount: DecimalStringSchema,
  cost_center_id: z.string().uuid().nullable().optional().default(null),
  branch_id: z.string().uuid().nullable().optional().default(null),
});

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  fiscal_year: z.number(),
  status: z.string(),
  version: z.number(),
  notes: z.string().nullable().optional().default(null),
  lines: z.array(BudgetLineSchema).optional().default([]),
  available_actions: z.array(z.string()).optional().default([]),
});
export type Budget = z.infer<typeof BudgetSchema>;

export const BudgetListSchema = z.array(BudgetSchema);

export const BudgetLineInputSchema = z.object({
  account_id: z.string().uuid(),
  period_start: z.string().min(1),
  amount: z.string().min(1),
  cost_center_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
});

export const BudgetCreateRequestSchema = z.object({
  name: z.string().trim().min(1).max(150),
  fiscal_year: z.number().int().min(2000).max(2100),
  notes: z.string().optional(),
  lines: z.array(BudgetLineInputSchema).min(1),
});
export type BudgetCreateRequest = z.infer<typeof BudgetCreateRequestSchema>;

export const BudgetLineFormSchema = z.object({
  account_id: z.string().uuid("Choose an account"),
  period_start: z.string().min(1, "Choose a period"),
  amount: z.string().trim().min(1, "Amount is required"),
  cost_center_id: z.string().optional(),
  branch_id: z.string().optional(),
});

export const BudgetFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  fiscal_year: z.string().regex(/^\d{4}$/, "Enter a year"),
  notes: z.string().optional(),
  lines: z.array(BudgetLineFormSchema).min(1, "Add at least one line"),
});
export type BudgetFormValues = z.infer<typeof BudgetFormSchema>;

export const BudgetVsActualLineSchema = z.object({
  account_id: z.string().uuid(),
  account_code: z.string(),
  account_name: z.string(),
  period_start: z.string(),
  budget_amount: DecimalStringSchema,
  actual_amount: DecimalStringSchema,
  variance_amount: DecimalStringSchema,
  source_id: z.string().uuid().nullable().optional().default(null),
});

export const BudgetVsActualSchema = z.object({
  budget_id: z.string().uuid(),
  budget_name: z.string(),
  currency_code: z.string().nullable().optional().default(null),
  from_date: z.string(),
  to_date: z.string(),
  total_budget: DecimalStringSchema,
  total_actual: DecimalStringSchema,
  total_variance: DecimalStringSchema,
  total_budget_income: DecimalStringSchema.optional().default("0"),
  total_budget_expense: DecimalStringSchema.optional().default("0"),
  total_actual_income: DecimalStringSchema.optional().default("0"),
  total_actual_expense: DecimalStringSchema.optional().default("0"),
  lines: z.array(BudgetVsActualLineSchema).optional().default([]),
});
export type BudgetVsActual = z.infer<typeof BudgetVsActualSchema>;

export type BudgetListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: string;
  fiscal_year?: number;
};
