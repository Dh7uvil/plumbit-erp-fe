import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  DocumentSequenceCreateRequestSchema,
  DocumentSequenceListSchema,
  DocumentSequenceSchema,
  DocumentSequenceUpdateRequestSchema,
  type DocumentSequence,
  type DocumentSequenceCreateRequest,
  type DocumentSequenceListParams,
  type DocumentSequenceUpdateRequest,
} from "@/modules/erp/accounting/document-sequences/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const documentSequencesApi = {
  list: async (
    params: DocumentSequenceListParams = {},
  ): Promise<ListResponse<DocumentSequence[]>> => {
    const result = await apiClient.getList<unknown>("/document-sequences", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: DocumentSequenceListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<DocumentSequence[]> =>
    fetchAllPages((page, pageSize) => documentSequencesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<DocumentSequence> =>
    DocumentSequenceSchema.parse(await apiClient.get(`/document-sequences/${id}`)),
  create: async (values: DocumentSequenceCreateRequest): Promise<DocumentSequence> =>
    DocumentSequenceSchema.parse(
      await apiClient.post("/document-sequences", DocumentSequenceCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: DocumentSequenceUpdateRequest): Promise<DocumentSequence> =>
    DocumentSequenceSchema.parse(
      await apiClient.patch(
        `/document-sequences/${id}`,
        DocumentSequenceUpdateRequestSchema.parse(values),
      ),
    ),
  delete: async (id: string): Promise<DocumentSequence> =>
    DocumentSequenceSchema.parse(await apiClient.delete(`/document-sequences/${id}`)),
};
