import { DEFAULT_PAGE_SIZE, OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  CustomerCreateRequestSchema,
  CustomerExtraAddressCreateRequestSchema,
  CustomerExtraAddressSchema,
  CustomerListSchema,
  CustomerSchema,
  CustomerUpdateRequestSchema,
  type Customer,
  type CustomerCreateRequest,
  type CustomerExtraAddress,
  type CustomerExtraAddressCreateRequest,
  type CustomerFormValues,
  type CustomerListParams,
  type CustomerUpdateRequest,
} from "@/modules/crm/customers/schemas";
import { emptyToNull, toAddressPayload } from "@/modules/users-management/tenants/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toCreatePayload(values: CustomerFormValues): CustomerCreateRequest {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    company_type: values.company_type,
    trn: emptyToNull(values.trn),
    tax_treatment: values.tax_treatment,
    currency_id: optionalUuid(values.currency_id),
    default_price_list_id: optionalUuid(values.default_price_list_id),
    payment_terms_id: optionalUuid(values.payment_terms_id),
    credit_limit: emptyToNull(values.credit_limit),
    salesperson_id: optionalUuid(values.salesperson_id),
    billing_address: toAddressPayload(values.billing_address),
    shipping_address: toAddressPayload(values.shipping_address),
    notes: emptyToNull(values.notes),
  };
}

function toUpdatePayload(values: CustomerFormValues): CustomerUpdateRequest {
  return {
    name: values.name.trim(),
    trn: emptyToNull(values.trn),
    tax_treatment: values.tax_treatment,
    currency_id: optionalUuid(values.currency_id),
    default_price_list_id: optionalUuid(values.default_price_list_id),
    payment_terms_id: optionalUuid(values.payment_terms_id),
    credit_limit: emptyToNull(values.credit_limit),
    salesperson_id: optionalUuid(values.salesperson_id),
    billing_address: toAddressPayload(values.billing_address),
    shipping_address: toAddressPayload(values.shipping_address),
    notes: emptyToNull(values.notes),
    is_active: values.is_active,
  };
}

export const customersApi = {
  list: async (params: CustomerListParams = {}): Promise<ListResponse<Customer[]>> => {
    const result = await apiClient.getList<unknown>("/customers", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        tax_treatment: params.tax_treatment,
        currency_id: params.currency_id,
        company_type: params.company_type,
        is_active: params.is_active,
      },
    });
    return { data: CustomerListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Customer[]> =>
    fetchAllPages((page, pageSize) => customersApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Customer> =>
    CustomerSchema.parse(await apiClient.get(`/customers/${id}`)),
  create: async (values: CustomerFormValues): Promise<Customer> =>
    CustomerSchema.parse(
      await apiClient.post(
        "/customers",
        CustomerCreateRequestSchema.parse(toCreatePayload(values)),
      ),
    ),
  update: async (id: string, values: CustomerFormValues): Promise<Customer> =>
    CustomerSchema.parse(
      await apiClient.patch(
        `/customers/${id}`,
        CustomerUpdateRequestSchema.parse(toUpdatePayload(values)),
      ),
    ),
  delete: async (id: string): Promise<Customer> =>
    CustomerSchema.parse(await apiClient.delete(`/customers/${id}`)),
  addAddress: async (
    id: string,
    values: CustomerExtraAddressCreateRequest,
  ): Promise<CustomerExtraAddress> =>
    CustomerExtraAddressSchema.parse(
      await apiClient.post(
        `/customers/${id}/addresses`,
        CustomerExtraAddressCreateRequestSchema.parse(values),
      ),
    ),
  deleteAddress: async (id: string, extraId: string): Promise<CustomerExtraAddress> =>
    CustomerExtraAddressSchema.parse(
      await apiClient.delete(`/customers/${id}/addresses/${extraId}`),
    ),
};
