import { DEFAULT_PAGE_SIZE, OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  AccountCreateRequestSchema,
  accountTypeForSubtype,
  AccountBalanceSchema,
  AccountListSchema,
  AccountPeriodBalancesSchema,
  AccountSchema,
  AccountTreeSchema,
  AccountUpdateRequestSchema,
  SystemRoleMappingListSchema,
  SystemRoleMappingSchema,
  type Account,
  type AccountBalance,
  type AccountPeriodBalances,
  type AccountCreateRequest,
  type AccountFormValues,
  type AccountListParams,
  type AccountTreeNode,
  type AccountUpdateRequest,
  type SystemRoleMapping,
} from "@/modules/erp/accounting/accounts/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function partyLinkFromForm(values: AccountFormValues): AccountCreateRequest["party_link"] {
  if (values.is_group) {
    return undefined;
  }
  if (values.ledger_kind === "standalone") {
    return undefined;
  }
  if (values.ledger_kind === "new_party") {
    const partyType =
      values.account_subtype === "ACCOUNTS_RECEIVABLE" ? "CUSTOMER" : "SUPPLIER";
    return {
      mode: "new",
      party_type: partyType,
      name: values.party_name.trim() || values.name.trim(),
    };
  }
  if (values.ledger_kind === "existing_party") {
    const partyId = optionalUuid(values.party_id);
    if (!partyId) {
      return undefined;
    }
    const partyType =
      values.account_subtype === "ACCOUNTS_RECEIVABLE" ? "CUSTOMER" : "SUPPLIER";
    return { mode: "existing", party_type: partyType, party_id: partyId };
  }
  return undefined;
}

function toCreatePayload(values: AccountFormValues): AccountCreateRequest {
  const name = values.name.trim();
  return {
    code: values.code.trim(),
    name,
    description: emptyToNull(name),
    account_type: accountTypeForSubtype(values.account_subtype),
    account_subtype: values.account_subtype,
    parent_id: optionalUuid(values.parent_id),
    is_group: values.is_group,
    is_blocked: values.is_blocked,
    currency_id: optionalUuid(values.currency_id),
    default_tax_id: optionalUuid(values.default_tax_id),
  };
}

function toUpdatePayload(
  values: AccountFormValues,
  isSystem: boolean,
  existing?: Account,
): AccountUpdateRequest {
  const accountType = accountTypeForSubtype(values.account_subtype);
  const description = values.name.trim();
  const payload: AccountUpdateRequest = {
    ...(isSystem ? {} : { code: values.code.trim() }),
    name: values.name.trim(),
    description: emptyToNull(description),
    account_type: accountType,
    account_subtype: values.account_subtype,
    parent_id: optionalUuid(values.parent_id),
    is_group: values.is_group,
    is_active: values.is_active,
    is_blocked: values.is_blocked,
  };
  if (existing) {
    payload.currency_id = existing.currency_id;
    payload.default_tax_id = existing.default_tax_id;
    if (
      !values.is_group &&
      (values.account_subtype === "ACCOUNTS_RECEIVABLE" ||
        values.account_subtype === "ACCOUNTS_PAYABLE")
    ) {
      payload.is_standalone_ledger = existing.is_standalone_ledger;
    }
  }
  return payload;
}

export const accountsApi = {
  list: async (params: AccountListParams = {}): Promise<ListResponse<Account[]>> => {
    const result = await apiClient.getList<unknown>("/accounts", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        account_type: params.account_type,
        account_subtype: params.account_subtype,
        is_group: params.is_group,
        is_active: params.is_active,
        is_blocked: params.is_blocked,
        is_standalone_ledger: params.is_standalone_ledger,
      },
    });
    return { data: AccountListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: AccountListParams = {}): Promise<Account[]> =>
    fetchAllPages((page, pageSize) => accountsApi.list({ ...params, page, page_size: pageSize })),
  tree: async (): Promise<AccountTreeNode[]> =>
    AccountTreeSchema.parse(await apiClient.get("/accounts/tree")),
  get: async (id: string): Promise<Account> =>
    AccountSchema.parse(await apiClient.get(`/accounts/${id}`)),
  balance: async (id: string, asOf?: string): Promise<AccountBalance> =>
    AccountBalanceSchema.parse(
      await apiClient.get(`/accounts/${id}/balance`, { params: { as_of: asOf } }),
    ),
  periodBalances: async (id: string, fiscalYear?: number): Promise<AccountPeriodBalances> =>
    AccountPeriodBalancesSchema.parse(
      await apiClient.get(`/accounts/${id}/period-balances`, {
        params: { fiscal_year: fiscalYear },
      }),
    ),
  create: async (values: AccountFormValues): Promise<Account> =>
    AccountSchema.parse(
      await apiClient.post("/accounts", AccountCreateRequestSchema.parse(toCreatePayload(values))),
    ),
  update: async (
    id: string,
    values: AccountFormValues,
    isSystem = false,
    existing?: Account,
  ): Promise<Account> =>
    AccountSchema.parse(
      await apiClient.patch(
        `/accounts/${id}`,
        AccountUpdateRequestSchema.parse(toUpdatePayload(values, isSystem, existing)),
      ),
    ),
  delete: async (id: string): Promise<Account> =>
    AccountSchema.parse(await apiClient.delete(`/accounts/${id}`)),
  systemRoles: async (): Promise<SystemRoleMapping[]> =>
    SystemRoleMappingListSchema.parse(await apiClient.get("/accounts/system-roles")),
  mapSystemRole: async (role: string, accountId: string): Promise<SystemRoleMapping> =>
    SystemRoleMappingSchema.parse(
      await apiClient.put(`/accounts/system-roles/${role}`, { account_id: accountId }),
    ),
};
