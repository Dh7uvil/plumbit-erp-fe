import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  TermsTemplateCreateRequestSchema,
  TermsTemplateListSchema,
  TermsTemplateSchema,
  TermsTemplateUpdateRequestSchema,
  type TermsTemplate,
  type TermsTemplateCreateRequest,
  type TermsTemplateListParams,
  type TermsTemplateUpdateRequest,
} from "@/modules/erp/accounting/terms-templates/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const termsTemplatesApi = {
  list: async (params: TermsTemplateListParams = {}): Promise<ListResponse<TermsTemplate[]>> => {
    const result = await apiClient.getList<unknown>("/terms-templates", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: TermsTemplateListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<TermsTemplate[]> =>
    fetchAllPages((page, pageSize) => termsTemplatesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<TermsTemplate> =>
    TermsTemplateSchema.parse(await apiClient.get(`/terms-templates/${id}`)),
  create: async (values: TermsTemplateCreateRequest): Promise<TermsTemplate> =>
    TermsTemplateSchema.parse(
      await apiClient.post("/terms-templates", TermsTemplateCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: TermsTemplateUpdateRequest): Promise<TermsTemplate> =>
    TermsTemplateSchema.parse(
      await apiClient.patch(
        `/terms-templates/${id}`,
        TermsTemplateUpdateRequestSchema.parse(values),
      ),
    ),
  delete: async (id: string): Promise<TermsTemplate> =>
    TermsTemplateSchema.parse(await apiClient.delete(`/terms-templates/${id}`)),
};
