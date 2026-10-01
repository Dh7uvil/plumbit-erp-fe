import {
  DeliveredMarkerRequestSchema,
  MessageCreateRequestSchema,
  MessageForwardRequestSchema,
  MessageListPageSchema,
  MessageSchema,
  MessageUpdateRequestSchema,
  ReactionResponseSchema,
  SavedMessageResponseSchema,
  MESSAGE_PAGE_SIZE,
  type DeliveredMarkerRequest,
  type Message,
  type MessageCreateRequest,
  type MessageForwardRequest,
  type MessageListPage,
  type MessageListParams,
  type MessageUpdateRequest,
  type ReactionResponse,
  type SavedMessageResponse,
} from "@/modules/communication/messages/schemas";
import { apiClient } from "@/shared/api/client";

export const messagesApi = {
  list: async (
    conversationId: string,
    params: MessageListParams = {},
  ): Promise<MessageListPage> => {
    const data = await apiClient.get<unknown>(
      `/communication/conversations/${conversationId}/messages`,
      {
        params: {
          before_seq: params.before_seq,
          after_seq: params.after_seq,
          limit: params.limit ?? MESSAGE_PAGE_SIZE,
        },
      },
    );
    return MessageListPageSchema.parse(data);
  },
  create: async (conversationId: string, values: MessageCreateRequest): Promise<Message> =>
    MessageSchema.parse(
      await apiClient.post(
        `/communication/conversations/${conversationId}/messages`,
        MessageCreateRequestSchema.parse(values),
      ),
    ),
  createAttachment: async (
    conversationId: string,
    file: File,
    clientMessageId?: string,
  ): Promise<Message> => {
    const body = new FormData();
    body.set("file", file);
    if (clientMessageId) {
      body.set("client_message_id", clientMessageId);
    }
    return MessageSchema.parse(
      await apiClient.postForm(
        `/communication/conversations/${conversationId}/messages/attachment`,
        body,
      ),
    );
  },
  markDelivered: async (conversationId: string, values: DeliveredMarkerRequest): Promise<void> => {
    await apiClient.post(
      `/communication/conversations/${conversationId}/delivered`,
      DeliveredMarkerRequestSchema.parse(values),
    );
  },
  update: async (messageId: string, values: MessageUpdateRequest): Promise<Message> =>
    MessageSchema.parse(
      await apiClient.patch(
        `/communication/messages/${messageId}`,
        MessageUpdateRequestSchema.parse(values),
      ),
    ),
  delete: async (messageId: string): Promise<Message> =>
    MessageSchema.parse(await apiClient.delete(`/communication/messages/${messageId}`)),
  addReaction: async (messageId: string, emoji: string): Promise<ReactionResponse> =>
    ReactionResponseSchema.parse(
      await apiClient.put(
        `/communication/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      ),
    ),
  removeReaction: async (messageId: string, emoji: string): Promise<void> => {
    await apiClient.delete(
      `/communication/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    );
  },
  save: async (messageId: string): Promise<SavedMessageResponse> =>
    SavedMessageResponseSchema.parse(
      await apiClient.post(`/communication/messages/${messageId}/save`),
    ),
  unsave: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/communication/messages/${messageId}/save`);
  },
  forward: async (messageId: string, values: MessageForwardRequest): Promise<Message> =>
    MessageSchema.parse(
      await apiClient.post(
        `/communication/messages/${messageId}/forward`,
        MessageForwardRequestSchema.parse(values),
      ),
    ),
};
