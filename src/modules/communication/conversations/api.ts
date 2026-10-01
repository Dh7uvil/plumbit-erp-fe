import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ConversationAttachmentSchema,
  ConversationCreateRequestSchema,
  ConversationForContextRequestSchema,
  ConversationListSchema,
  ConversationSchema,
  ConversationUpdateRequestSchema,
  ParticipantAddRequestSchema,
  ParticipantSchema,
  ReadMarkerRequestSchema,
  UnreadSummarySchema,
  type Conversation,
  type ConversationAttachment,
  type ConversationCreateRequest,
  type ConversationForContextRequest,
  type ConversationListParams,
  type ConversationUpdateRequest,
  type Participant,
  type ParticipantAddRequest,
  type ReadMarkerRequest,
  type UnreadSummary,
} from "@/modules/communication/conversations/schemas";
import { MessageSchema, type Message } from "@/modules/communication/messages/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

const BASE = "/communication/conversations";

export const conversationsApi = {
  list: async (params: ConversationListParams = {}): Promise<ListResponse<Conversation[]>> => {
    const result = await apiClient.getList<unknown>(BASE, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        kind: params.kind,
      },
    });
    return { data: ConversationListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Conversation> =>
    ConversationSchema.parse(await apiClient.get(`${BASE}/${id}`)),
  create: async (values: ConversationCreateRequest): Promise<Conversation> =>
    ConversationSchema.parse(
      await apiClient.post(BASE, ConversationCreateRequestSchema.parse(values)),
    ),
  forContext: async (values: ConversationForContextRequest): Promise<Conversation> =>
    ConversationSchema.parse(
      await apiClient.post(
        `${BASE}/for-context`,
        ConversationForContextRequestSchema.parse(values),
      ),
    ),
  update: async (id: string, values: ConversationUpdateRequest): Promise<Conversation> =>
    ConversationSchema.parse(
      await apiClient.patch(`${BASE}/${id}`, ConversationUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
  unreadSummary: async (): Promise<UnreadSummary> =>
    UnreadSummarySchema.parse(await apiClient.get(`${BASE}/unread-summary`)),
  listParticipants: async (id: string): Promise<Participant[]> => {
    const data = await apiClient.get<unknown>(`${BASE}/${id}/participants`);
    return zArray(ParticipantSchema).parse(data);
  },
  addParticipant: async (id: string, values: ParticipantAddRequest): Promise<Participant> =>
    ParticipantSchema.parse(
      await apiClient.post(`${BASE}/${id}/participants`, ParticipantAddRequestSchema.parse(values)),
    ),
  removeParticipant: async (conversationId: string, userId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${conversationId}/participants/${userId}`);
  },
  leave: async (id: string): Promise<void> => {
    await apiClient.post(`${BASE}/${id}/leave`, {});
  },
  markRead: async (id: string, values: ReadMarkerRequest): Promise<void> => {
    await apiClient.post(`${BASE}/${id}/read`, ReadMarkerRequestSchema.parse(values));
  },
  typing: async (id: string, isTyping: boolean): Promise<void> => {
    await apiClient.post(`${BASE}/${id}/typing`, { is_typing: isTyping });
  },
  listAttachments: async (
    id: string,
    kind?: "file" | "media",
  ): Promise<ConversationAttachment[]> => {
    const data = await apiClient.get<unknown>(`${BASE}/${id}/attachments`, {
      params: { kind },
    });
    return zArray(ConversationAttachmentSchema).parse(data);
  },
  listPins: async (conversationId: string): Promise<Message[]> => {
    const data = await apiClient.get<unknown>(`${BASE}/${conversationId}/pins`);
    return zArray(MessageSchema).parse(data);
  },
  pinMessage: async (conversationId: string, messageId: string): Promise<Message> =>
    MessageSchema.parse(
      await apiClient.post(`${BASE}/${conversationId}/pins/${messageId}`),
    ),
  unpinMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${conversationId}/pins/${messageId}`);
  },
};

function zArray<T>(schema: { parse: (v: unknown) => T }) {
  return {
    parse: (value: unknown) => {
      if (!Array.isArray(value)) {
        throw new Error("Expected array");
      }
      return value.map((item) => schema.parse(item));
    },
  };
}
