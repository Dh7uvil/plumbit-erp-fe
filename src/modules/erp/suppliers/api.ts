import { DEFAULT_PAGE_SIZE, OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  SupplierCreateRequestSchema,
  SupplierExtraAddressCreateRequestSchema,
  SupplierExtraAddressSchema,
  SupplierListSchema,
  SupplierSchema,
  SupplierUpdateRequestSchema,
  type Supplier,
  type SupplierCreateRequest,
  type SupplierExtraAddress,
  type SupplierExtraAddressCreateRequest,
  type SupplierFormValues,
  type SupplierListParams,
  type SupplierUpdateRequest,
} from "@/modules/erp/suppliers/schemas";
import { emptyToNull, toAddressPayload } from "@/modules/users-management/tenants/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toCreatePayload(values: SupplierFormValues): SupplierCreateRequest {
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

function toUpdatePayload(values: SupplierFormValues): SupplierUpdateRequest {
  return {
    name: values.name.trim(),
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
    is_active: values.is_active,
  };
}

export const suppliersApi = {
  list: async (params: SupplierListParams = {}): Promise<ListResponse<Supplier[]>> => {
    const result = await apiClient.getList<unknown>("/suppliers", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        tax_treatment: params.tax_treatment,
        currency_id: params.currency_id,
        is_active: params.is_active,
      },
    });
    return { data: SupplierListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Supplier[]> =>
    fetchAllPages((page, pageSize) => suppliersApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Supplier> =>
    SupplierSchema.parse(await apiClient.get(`/suppliers/${id}`)),
  create: async (values: SupplierFormValues): Promise<Supplier> =>
    SupplierSchema.parse(
      await apiClient.post(
        "/suppliers",
        SupplierCreateRequestSchema.parse(toCreatePayload(values)),
      ),
    ),
  update: async (id: string, values: SupplierFormValues): Promise<Supplier> =>
    SupplierSchema.parse(
      await apiClient.patch(
        `/suppliers/${id}`,
        SupplierUpdateRequestSchema.parse(toUpdatePayload(values)),
      ),
    ),
  delete: async (id: string): Promise<Supplier> =>
    SupplierSchema.parse(await apiClient.delete(`/suppliers/${id}`)),
  addAddress: async (
    id: string,
    values: SupplierExtraAddressCreateRequest,
  ): Promise<SupplierExtraAddress> =>
    SupplierExtraAddressSchema.parse(
      await apiClient.post(
        `/suppliers/${id}/addresses`,
        SupplierExtraAddressCreateRequestSchema.parse(values),
      ),
    ),
  deleteAddress: async (id: string, extraId: string): Promise<SupplierExtraAddress> =>
    SupplierExtraAddressSchema.parse(
      await apiClient.delete(`/suppliers/${id}/addresses/${extraId}`),
    ),
};
