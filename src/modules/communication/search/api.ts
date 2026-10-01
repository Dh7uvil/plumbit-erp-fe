import { MessageSchema, type Message } from "@/modules/communication/messages/schemas";
import {
  SearchResponseSchema,
  type ConversationMessageSearchParams,
  type SearchParams,
  type SearchResponse,
} from "@/modules/communication/search/schemas";
import { apiClient } from "@/shared/api/client";

export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResponse> =>
    SearchResponseSchema.parse(
      await apiClient.get("/communication/search", {
        params: {
          q: params.q,
          type: params.type,
          limit: params.limit ?? 50,
        },
      }),
    ),
  searchConversationMessages: async (
    conversationId: string,
    params: ConversationMessageSearchParams,
  ): Promise<Message[]> => {
    const data = await apiClient.get<unknown>(
      `/communication/conversations/${conversationId}/messages/search`,
      {
        params: {
          q: params.q,
          limit: params.limit ?? 50,
        },
      },
    );
    if (!Array.isArray(data)) {
      throw new Error("Expected array");
    }
    return data.map((item) => MessageSchema.parse(item));
  },
};
