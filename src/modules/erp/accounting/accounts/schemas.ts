import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema } from "@/shared/lib/money";

export const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;
export const AccountTypeSchema = z.enum(ACCOUNT_TYPES);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  EQUITY: "Equity",
  INCOME: "Income",
  EXPENSE: "Expense",
};

export const ACCOUNT_SUBTYPES = [
  "BANK",
  "CASH",
  "ACCOUNTS_RECEIVABLE",
  "ACCOUNTS_PAYABLE",
  "STOCK",
  "FIXED_ASSET",
  "OTHER_CURRENT_ASSET",
  "OTHER_CURRENT_LIABILITY",
  "TAX_PAYABLE",
  "TAX_RECEIVABLE",
  "EQUITY",
  "INCOME",
  "OTHER_INCOME",
  "COGS",
  "EXPENSE",
  "OTHER_EXPENSE",
] as const;
export const AccountSubtypeSchema = z.enum(ACCOUNT_SUBTYPES);
export type AccountSubtype = z.infer<typeof AccountSubtypeSchema>;

export const ACCOUNT_SUBTYPES_BY_TYPE: Record<AccountType, readonly AccountSubtype[]> = {
  ASSET: [
    "BANK",
    "CASH",
    "ACCOUNTS_RECEIVABLE",
    "STOCK",
    "FIXED_ASSET",
    "OTHER_CURRENT_ASSET",
    "TAX_RECEIVABLE",
  ],
  LIABILITY: ["ACCOUNTS_PAYABLE", "OTHER_CURRENT_LIABILITY", "TAX_PAYABLE"],
  EQUITY: ["EQUITY"],
  INCOME: ["INCOME", "OTHER_INCOME"],
  EXPENSE: ["COGS", "EXPENSE", "OTHER_EXPENSE"],
};

export const ACCOUNT_SUBTYPE_LABELS: Record<AccountSubtype, string> = {
  BANK: "Bank",
  CASH: "Cash",
  ACCOUNTS_RECEIVABLE: "Accounts receivable",
  ACCOUNTS_PAYABLE: "Accounts payable",
  STOCK: "Stock",
  FIXED_ASSET: "Fixed asset",
  OTHER_CURRENT_ASSET: "Other current asset",
  OTHER_CURRENT_LIABILITY: "Other current liability",
  TAX_PAYABLE: "Tax payable",
  TAX_RECEIVABLE: "Tax receivable",
  EQUITY: "Equity",
  INCOME: "Income",
  OTHER_INCOME: "Other income",
  COGS: "Cost of goods sold",
  EXPENSE: "Expense",
  OTHER_EXPENSE: "Other expense",
};

export const ACCOUNT_SYSTEM_ROLES = [
  "ACCOUNTS_RECEIVABLE",
  "ACCOUNTS_PAYABLE",
  "SALES_REVENUE",
  "SALES_RETURNS",
  "PURCHASES",
  "INVENTORY",
  "COGS",
  "INVENTORY_ADJUSTMENT",
  "STOCK_SCRAP",
  "VAT_OUTPUT",
  "VAT_INPUT",
  "VAT_RCM_OUTPUT",
  "VAT_RCM_INPUT",
  "CUSTOMS_DUTY",
  "FREIGHT_IN",
  "PURCHASE_PRICE_VARIANCE",
  "ADVANCE_FROM_CUSTOMER",
  "ADVANCE_TO_SUPPLIER",
  "FX_GAIN_LOSS",
  "ROUND_OFF",
  "RETAINED_EARNINGS",
  "OPENING_BALANCE_EQUITY",
  "CASH_ON_HAND",
  "BANK",
  "BANK_CHARGES",
  "GOODS_RECEIVED_NOT_INVOICED",
  "SHIPPING_INCOME",
  "OTHER_CHARGES",
  "LANDED_COST_VARIANCE", // legacy chart role; not used by GRN charges
  "CHEQUES_RECEIVABLE",
  "CHEQUES_PAYABLE",
  "BAD_DEBT_EXPENSE",
  "SUSPENSE",
] as const;
export const AccountSystemRoleSchema = z.enum(ACCOUNT_SYSTEM_ROLES);
export type AccountSystemRole = z.infer<typeof AccountSystemRoleSchema>;

export const ACCOUNT_SYSTEM_ROLE_LABELS: Record<AccountSystemRole, string> = {
  ACCOUNTS_RECEIVABLE: "Accounts receivable",
  ACCOUNTS_PAYABLE: "Accounts payable",
  SALES_REVENUE: "Sales revenue",
  SALES_RETURNS: "Sales returns",
  PURCHASES: "Purchases",
  INVENTORY: "Inventory",
  COGS: "Cost of goods sold",
  INVENTORY_ADJUSTMENT: "Inventory adjustment",
  STOCK_SCRAP: "Stock scrap",
  VAT_OUTPUT: "VAT output",
  VAT_INPUT: "VAT input",
  VAT_RCM_OUTPUT: "VAT RCM output",
  VAT_RCM_INPUT: "VAT RCM input",
  CUSTOMS_DUTY: "Customs duty",
  FREIGHT_IN: "Freight in",
  PURCHASE_PRICE_VARIANCE: "Purchase price variance",
  ADVANCE_FROM_CUSTOMER: "Advance from customer",
  ADVANCE_TO_SUPPLIER: "Advance to supplier",
  FX_GAIN_LOSS: "FX gain/loss",
  ROUND_OFF: "Round off",
  RETAINED_EARNINGS: "Retained earnings",
  OPENING_BALANCE_EQUITY: "Opening balance equity",
  CASH_ON_HAND: "Cash on hand",
  BANK: "Bank",
  BANK_CHARGES: "Bank charges",
  GOODS_RECEIVED_NOT_INVOICED: "Goods received not invoiced",
  SHIPPING_INCOME: "Shipping income",
  OTHER_CHARGES: "Other charges",
  LANDED_COST_VARIANCE: "Landed cost variance (legacy)",
  CHEQUES_RECEIVABLE: "Cheques receivable (PDC)",
  CHEQUES_PAYABLE: "Cheques payable (PDC)",
  BAD_DEBT_EXPENSE: "Bad debt expense",
  SUSPENSE: "Suspense",
};

export const CONTROL_ACCOUNT_SUBTYPES = new Set<AccountSubtype>([
  "ACCOUNTS_RECEIVABLE",
  "ACCOUNTS_PAYABLE",
]);

export const AccountSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  account_type: AccountTypeSchema,
  account_subtype: AccountSubtypeSchema,
  parent_id: z.string().uuid().nullable(),
  parent_code: z.string().nullable().optional().default(null),
  parent_name: z.string().nullable().optional().default(null),
  depth: z.number().int(),
  is_group: z.boolean(),
  is_system: z.boolean(),
  system_role: AccountSystemRoleSchema.nullable(),
  currency_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
  is_blocked: z.boolean().optional().default(false),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
  has_children: z.boolean().optional().default(false),
  has_journal_lines: z.boolean().optional().default(false),
});
export type Account = z.infer<typeof AccountSchema>;

export type AccountTreeNode = Account & { children: AccountTreeNode[] };

export const AccountTreeNodeSchema: z.ZodType<AccountTreeNode> = AccountSchema.extend({
  children: z.lazy(() => z.array(AccountTreeNodeSchema)),
});

export const AccountListSchema = z.array(AccountSchema);
export const AccountTreeSchema = z.array(AccountTreeNodeSchema);

export const SystemRoleMappingSchema = z.object({
  role: AccountSystemRoleSchema,
  account_id: z.string().uuid().nullable(),
  account_code: z.string().nullable().optional(),
  account_name: z.string().nullable().optional(),
});
export type SystemRoleMapping = z.infer<typeof SystemRoleMappingSchema>;
export const SystemRoleMappingListSchema = z.array(SystemRoleMappingSchema);

export const AccountCreateRequestSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  account_type: AccountTypeSchema,
  account_subtype: AccountSubtypeSchema,
  parent_id: z.string().uuid().nullable().optional(),
  is_group: z.boolean().optional(),
  is_blocked: z.boolean().optional(),
  currency_id: z.string().uuid().nullable().optional(),
});
export type AccountCreateRequest = z.infer<typeof AccountCreateRequestSchema>;

export const AccountUpdateRequestSchema = z.object({
  code: z.string().min(1).max(20).nullable().optional(),
  name: z.string().min(1).max(200).nullable().optional(),
  description: z.string().nullable().optional(),
  account_type: AccountTypeSchema.nullable().optional(),
  account_subtype: AccountSubtypeSchema.nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_group: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  is_blocked: z.boolean().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
});
export type AccountUpdateRequest = z.infer<typeof AccountUpdateRequestSchema>;

export const AccountFormSchema = z.object({
  code: z.string().min(1, "Enter a code").max(20),
  sub_account_number: z.string(),
  manual_code: z.boolean(),
  name: z.string().min(1, "Enter a name").max(200),
  description: z.string(),
  account_type: AccountTypeSchema,
  account_subtype: AccountSubtypeSchema,
  parent_id: z.string(),
  is_group: z.boolean(),
  is_active: z.boolean(),
  is_blocked: z.boolean(),
  currency_id: z.string(),
});
export type AccountFormValues = z.infer<typeof AccountFormSchema>;

export const EMPTY_ACCOUNT_FORM: AccountFormValues = {
  code: "",
  sub_account_number: "",
  manual_code: false,
  name: "",
  description: "",
  account_type: "ASSET",
  account_subtype: "OTHER_CURRENT_ASSET",
  parent_id: OPTIONAL_SELECT_NONE,
  is_group: false,
  is_active: true,
  is_blocked: false,
  currency_id: OPTIONAL_SELECT_NONE,
};

export const AccountBalanceSchema = z.object({
  account_id: z.string().uuid(),
  as_of: z.string(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  signed_balance: DecimalStringSchema,
  currency_code: z.string().nullable().optional().default(null),
});
export type AccountBalance = z.infer<typeof AccountBalanceSchema>;

export const AccountPeriodBalanceSchema = z.object({
  period: z.number().int(),
  from_date: z.string(),
  to_date: z.string(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  closing: DecimalStringSchema,
});
export type AccountPeriodBalance = z.infer<typeof AccountPeriodBalanceSchema>;

export const AccountPeriodBalancesSchema = z.object({
  account_id: z.string().uuid(),
  fiscal_year: z.number().int(),
  currency_code: z.string(),
  opening: DecimalStringSchema,
  periods: z.array(AccountPeriodBalanceSchema),
  closing: DecimalStringSchema,
});
export type AccountPeriodBalances = z.infer<typeof AccountPeriodBalancesSchema>;

/** Split a stored code into main (parent) and sub segments when possible. */
export function splitAccountCode(
  code: string,
  parentCode: string | null | undefined,
): { subAccountNumber: string; manualCode: boolean } {
  if (!parentCode || !code.startsWith(parentCode)) {
    return { subAccountNumber: "", manualCode: true };
  }
  return { subAccountNumber: code.slice(parentCode.length), manualCode: false };
}

/** Compose a full account code from a main (group) code and sub segment. */
export function composeAccountCode(mainCode: string, subAccountNumber: string): string {
  return `${mainCode}${subAccountNumber.trim()}`;
}

export type AccountListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  account_type?: AccountType;
  account_subtype?: AccountSubtype;
  is_group?: boolean;
  is_active?: boolean;
};

export function isControlAccount(account: Pick<Account, "account_subtype" | "is_group">): boolean {
  return !account.is_group && CONTROL_ACCOUNT_SUBTYPES.has(account.account_subtype);
}

export function isCashOrBankAccount(
  account: Pick<Account, "account_subtype" | "is_group" | "is_active">,
): boolean {
  return (
    !account.is_group &&
    account.is_active &&
    (account.account_subtype === "CASH" || account.account_subtype === "BANK")
  );
}

export function flattenAccountTree(nodes: AccountTreeNode[]): Account[] {
  const rows: Account[] = [];
  function walk(items: AccountTreeNode[]) {
    for (const item of items) {
      rows.push(item);
      if (item.children.length > 0) {
        walk(item.children);
      }
    }
  }
  walk(nodes);
  return rows;
}
