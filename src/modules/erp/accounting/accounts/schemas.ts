import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";

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
  depth: z.number().int(),
  is_group: z.boolean(),
  is_system: z.boolean(),
  system_role: AccountSystemRoleSchema.nullable(),
  currency_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
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
  currency_id: z.string().uuid().nullable().optional(),
});
export type AccountUpdateRequest = z.infer<typeof AccountUpdateRequestSchema>;

export const AccountFormSchema = z.object({
  code: z.string().min(1, "Enter a code").max(20),
  name: z.string().min(1, "Enter a name").max(200),
  description: z.string(),
  account_type: AccountTypeSchema,
  account_subtype: AccountSubtypeSchema,
  parent_id: z.string(),
  is_group: z.boolean(),
  is_active: z.boolean(),
  currency_id: z.string(),
});
export type AccountFormValues = z.infer<typeof AccountFormSchema>;

export const EMPTY_ACCOUNT_FORM: AccountFormValues = {
  code: "",
  name: "",
  description: "",
  account_type: "ASSET",
  account_subtype: "OTHER_CURRENT_ASSET",
  parent_id: OPTIONAL_SELECT_NONE,
  is_group: false,
  is_active: true,
  currency_id: OPTIONAL_SELECT_NONE,
};

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
