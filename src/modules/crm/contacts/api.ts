import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ContactCreateRequestSchema,
  ContactListSchema,
  ContactSchema,
  ContactUpdateRequestSchema,
  type Contact,
  type ContactCreateRequest,
  type ContactListParams,
  type ContactUpdateRequest,
} from "@/modules/crm/contacts/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const contactsApi = {
  list: async (params: ContactListParams = {}): Promise<ListResponse<Contact[]>> => {
    const result = await apiClient.getList<unknown>("/contacts", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        customer_id: params.customer_id,
        is_primary: params.is_primary,
        is_active: params.is_active,
      },
    });
    return { data: ContactListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Contact[]> =>
    fetchAllPages((page, pageSize) => contactsApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Contact> =>
    ContactSchema.parse(await apiClient.get(`/contacts/${id}`)),
  create: async (values: ContactCreateRequest): Promise<Contact> =>
    ContactSchema.parse(
      await apiClient.post("/contacts", ContactCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: ContactUpdateRequest): Promise<Contact> =>
    ContactSchema.parse(
      await apiClient.patch(`/contacts/${id}`, ContactUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Contact> =>
    ContactSchema.parse(await apiClient.delete(`/contacts/${id}`)),
};
