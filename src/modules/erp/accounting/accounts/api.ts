import { DEFAULT_PAGE_SIZE, OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  AccountCreateRequestSchema,
  AccountListSchema,
  AccountSchema,
  AccountTreeSchema,
  AccountUpdateRequestSchema,
  SystemRoleMappingListSchema,
  SystemRoleMappingSchema,
  type Account,
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

function toCreatePayload(values: AccountFormValues): AccountCreateRequest {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    description: emptyToNull(values.description),
    account_type: values.account_type,
    account_subtype: values.account_subtype,
    parent_id: optionalUuid(values.parent_id),
    is_group: values.is_group,
    currency_id: optionalUuid(values.currency_id),
  };
}

function toUpdatePayload(values: AccountFormValues, isSystem: boolean): AccountUpdateRequest {
  return {
    ...(isSystem ? {} : { code: values.code.trim() }),
    name: values.name.trim(),
    description: emptyToNull(values.description),
    account_type: values.account_type,
    account_subtype: values.account_subtype,
    parent_id: optionalUuid(values.parent_id),
    is_group: values.is_group,
    is_active: values.is_active,
    currency_id: optionalUuid(values.currency_id),
  };
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
  create: async (values: AccountFormValues): Promise<Account> =>
    AccountSchema.parse(
      await apiClient.post("/accounts", AccountCreateRequestSchema.parse(toCreatePayload(values))),
    ),
  update: async (id: string, values: AccountFormValues, isSystem = false): Promise<Account> =>
    AccountSchema.parse(
      await apiClient.patch(
        `/accounts/${id}`,
        AccountUpdateRequestSchema.parse(toUpdatePayload(values, isSystem)),
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
