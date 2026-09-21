import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  NoteCreateRequestSchema,
  NoteListSchema,
  NoteSchema,
  NoteUpdateRequestSchema,
  type Note,
  type NoteCreateRequest,
  type NoteListParams,
  type NoteUpdateRequest,
} from "@/modules/crm/notes/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const notesApi = {
  list: async (params: NoteListParams = {}): Promise<ListResponse<Note[]>> => {
    const result = await apiClient.getList<unknown>("/notes", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        related_entity_type: params.related_entity_type,
        related_entity_id: params.related_entity_id,
      },
    });
    return { data: NoteListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Note> => NoteSchema.parse(await apiClient.get(`/notes/${id}`)),
  create: async (values: NoteCreateRequest): Promise<Note> =>
    NoteSchema.parse(await apiClient.post("/notes", NoteCreateRequestSchema.parse(values))),
  update: async (id: string, values: NoteUpdateRequest): Promise<Note> =>
    NoteSchema.parse(await apiClient.patch(`/notes/${id}`, NoteUpdateRequestSchema.parse(values))),
  delete: async (id: string): Promise<Note> =>
    NoteSchema.parse(await apiClient.delete(`/notes/${id}`)),
};
