import { DEFAULT_PAGE_SIZE, OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  SupplierProductCreateRequestSchema,
  SupplierProductLinkRequestSchema,
  SupplierProductListSchema,
  SupplierProductResolveBatchRequestSchema,
  SupplierProductResolveListSchema,
  SupplierProductResolveSchema,
  SupplierProductSchema,
  SupplierProductUpdateRequestSchema,
  type SupplierProduct,
  type SupplierProductCreateRequest,
  type SupplierProductFormValues,
  type SupplierProductListParams,
  type SupplierProductResolve,
  type SupplierProductUpdateRequest,
} from "@/modules/erp/supplier-products/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toCreatePayload(values: SupplierProductFormValues): SupplierProductCreateRequest {
  return {
    supplier_id: values.supplier_id,
    product_id: optionalUuid(values.product_id),
    supplier_sku: values.supplier_sku.trim(),
    supplier_item_name: values.supplier_item_name.trim(),
    supplier_description: emptyToNull(values.supplier_description),
    price: emptyToNull(values.price),
    currency_id: optionalUuid(values.currency_id),
    is_preferred: values.is_preferred,
    is_preferred_supplier: values.is_preferred_supplier,
    notes: emptyToNull(values.notes),
    is_active: values.is_active,
  };
}

function toUpdatePayload(values: SupplierProductFormValues): SupplierProductUpdateRequest {
  return {
    supplier_sku: values.supplier_sku.trim(),
    supplier_item_name: values.supplier_item_name.trim(),
    supplier_description: emptyToNull(values.supplier_description),
    price: emptyToNull(values.price),
    currency_id: optionalUuid(values.currency_id),
    is_preferred: values.is_preferred,
    is_preferred_supplier: values.is_preferred_supplier,
    notes: emptyToNull(values.notes),
    is_active: values.is_active,
  };
}

export const supplierProductsApi = {
  list: async (
    params: SupplierProductListParams = {},
  ): Promise<ListResponse<SupplierProduct[]>> => {
    const result = await apiClient.getList<unknown>("/supplier-products", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        q: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        supplier_id: params.supplier_id,
        product_id: params.product_id,
        mapped: params.mapped,
        is_active: params.is_active,
        is_preferred: params.is_preferred,
        is_preferred_supplier: params.is_preferred_supplier,
      },
    });
    return { data: SupplierProductListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: SupplierProductListParams = {}): Promise<SupplierProduct[]> =>
    fetchAllPages((page, pageSize) =>
      supplierProductsApi.list({ ...params, page, page_size: pageSize }),
    ),
  get: async (id: string): Promise<SupplierProduct> =>
    SupplierProductSchema.parse(await apiClient.get(`/supplier-products/${id}`)),
  create: async (values: SupplierProductFormValues): Promise<SupplierProduct> =>
    SupplierProductSchema.parse(
      await apiClient.post(
        "/supplier-products",
        SupplierProductCreateRequestSchema.parse(toCreatePayload(values)),
      ),
    ),
  update: async (id: string, values: SupplierProductFormValues): Promise<SupplierProduct> =>
    SupplierProductSchema.parse(
      await apiClient.patch(
        `/supplier-products/${id}`,
        SupplierProductUpdateRequestSchema.parse(toUpdatePayload(values)),
      ),
    ),
  delete: async (id: string): Promise<SupplierProduct> =>
    SupplierProductSchema.parse(await apiClient.delete(`/supplier-products/${id}`)),
  link: async (id: string, productId: string): Promise<SupplierProduct> =>
    SupplierProductSchema.parse(
      await apiClient.post(
        `/supplier-products/${id}/link`,
        SupplierProductLinkRequestSchema.parse({ product_id: productId }),
      ),
    ),
  unlink: async (id: string): Promise<SupplierProduct> =>
    SupplierProductSchema.parse(await apiClient.post(`/supplier-products/${id}/unlink`)),
  resolve: async (supplierId: string, supplierSku: string): Promise<SupplierProductResolve> =>
    SupplierProductResolveSchema.parse(
      await apiClient.get("/supplier-products/resolve", {
        params: { supplier_id: supplierId, supplier_sku: supplierSku },
      }),
    ),
  resolveBatch: async (
    supplierId: string,
    supplierSkus: string[],
  ): Promise<SupplierProductResolve[]> =>
    SupplierProductResolveListSchema.parse(
      await apiClient.post(
        "/supplier-products/resolve",
        SupplierProductResolveBatchRequestSchema.parse({
          supplier_id: supplierId,
          supplier_skus: supplierSkus,
        }),
      ),
    ),
};
