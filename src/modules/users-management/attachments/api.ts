import { DEFAULT_PAGE_SIZE, MAX_ATTACHMENT_BYTES } from "@/config/constants";
import {
  AttachmentDetailSchema,
  AttachmentListSchema,
  AttachmentSchema,
  type Attachment,
  type AttachmentDetail,
  type AttachmentEntityType,
  type AttachmentListParams,
} from "@/modules/users-management/attachments/schemas";
import { apiClient } from "@/shared/api/client";
import { ApiError, getErrorMessage } from "@/shared/api/errors";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const attachmentsApi = {
  list: async (params: AttachmentListParams): Promise<ListResponse<Attachment[]>> => {
    const result = await apiClient.getList<unknown>("/attachments", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
      },
    });
    return { data: AttachmentListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<AttachmentListParams, "entity_type" | "entity_id">): Promise<Attachment[]> =>
    fetchAllPages((page, pageSize) =>
      attachmentsApi.list({ page, page_size: pageSize, ...params }),
    ),
  get: async (id: string): Promise<AttachmentDetail> =>
    AttachmentDetailSchema.parse(await apiClient.get(`/attachments/${id}`)),
  create: async (values: {
    entity_type: AttachmentEntityType;
    entity_id: string;
    file: File;
  }): Promise<Attachment> => {
    if (values.file.size > MAX_ATTACHMENT_BYTES) {
      throw new ApiError("VALIDATION_ERROR", getErrorMessage("VALIDATION_ERROR"), 400);
    }
    const body = new FormData();
    body.set("entity_type", values.entity_type);
    body.set("entity_id", values.entity_id);
    body.set("file", values.file);
    return AttachmentSchema.parse(await apiClient.postForm("/attachments", body));
  },
  delete: async (id: string): Promise<Attachment> =>
    AttachmentSchema.parse(await apiClient.delete(`/attachments/${id}`)),
};
