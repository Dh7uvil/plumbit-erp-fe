import type { InfiniteData } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Conversation } from "@/modules/communication/conversations/schemas";
import type { Message, MessageListPage } from "@/modules/communication/messages/schemas";
import { applyRealtimeEvent } from "@/modules/communication/realtime/cache-bridge";
import {
  isDuplicateUnreadMessageEvent,
  resetRealtimeEventDedupeForTests,
} from "@/modules/communication/realtime/event-dedupe";
import {
  conversationListQueryKey,
  messageListQueryKey,
} from "@/modules/communication/shared/tenant-query";
import type { ListResponse } from "@/shared/api/envelope";

const meta = { page: 1, page_size: 100, total: 1, total_pages: 1 };

function seedMessages(
  queryClient: QueryClient,
  listKey: ReturnType<typeof messageListQueryKey>,
  items: Message[],
): void {
  queryClient.setQueryData<InfiniteData<MessageListPage>>(listKey, {
    pages: [{ items, has_more: false }],
    pageParams: [undefined],
  });
}

describe("applyRealtimeEvent", () => {
  beforeEach(() => {
    resetRealtimeEventDedupeForTests();
  });

  it("appends when both channel deliveries arrive and dedupes unread once", () => {
    const queryClient = new QueryClient();
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const conversationId = "22222222-2222-4222-8222-222222222222";
    const recipientId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const listKey = messageListQueryKey(conversationId, tenantId);
    const messageId = "33333333-3333-4333-8333-333333333333";
    const conversationListKey = conversationListQueryKey(tenantId);
    queryClient.setQueryData<ListResponse<Conversation[]>>(conversationListKey, {
      data: [
        {
          id: conversationId,
          kind: "DIRECT",
          name: null,
          description: null,
          channel_name: "conv",
          message_seq: 4,
          last_message_at: null,
          only_admins_can_post: false,
          is_locked: false,
          unread_count: 0,
          participants: [],
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      meta,
    });

    seedMessages(queryClient, listKey, [
      {
        id: "44444444-4444-4444-8444-444444444444",
        conversation_id: conversationId,
        seq: 4,
        sender_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        kind: "TEXT",
        body: "hey",
        reply_to_message_id: null,
        client_message_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const basePayload = {
      v: 1 as const,
      type: "message.created" as const,
      conversation_id: conversationId,
      actor_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      seq: 5,
      at: "2026-01-02T00:00:00.000Z",
      data: {
        id: messageId,
        body: "hellop",
      },
    };

    applyRealtimeEvent(queryClient, tenantId, {
      ...basePayload,
      data: { ...basePayload.data, event_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
    }, { currentUserId: recipientId });
    applyRealtimeEvent(queryClient, tenantId, {
      ...basePayload,
      data: {
        ...basePayload.data,
        event_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        target_user_id: recipientId,
      },
    }, { currentUserId: recipientId });

    const rows =
      queryClient.getQueryData<InfiniteData<MessageListPage>>(listKey)?.pages.flatMap(
        (page) => page.items,
      ) ?? [];
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === messageId)?.body).toBe("hellop");
    const conversations = queryClient.getQueryData<ListResponse<Conversation[]>>(conversationListKey);
    expect(conversations?.data[0]?.unread_count).toBe(1);
    expect(isDuplicateUnreadMessageEvent({
      ...basePayload,
      data: { ...basePayload.data, event_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" },
    })).toBe(true);
  });

  it("does not double-increment unread for duplicate message.created", () => {
    const queryClient = new QueryClient();
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const conversationId = "22222222-2222-4222-8222-222222222222";
    const senderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const recipientId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const conversationListKey = conversationListQueryKey(tenantId);
    queryClient.setQueryData<ListResponse<Conversation[]>>(conversationListKey, {
      data: [
        {
          id: conversationId,
          kind: "DIRECT",
          name: null,
          description: null,
          channel_name: "conv",
          message_seq: 1,
          last_message_at: null,
          only_admins_can_post: false,
          is_locked: false,
          unread_count: 0,
          participants: [],
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      meta,
    });

    const payload = {
      v: 1 as const,
      type: "message.created" as const,
      conversation_id: conversationId,
      actor_id: senderId,
      seq: 2,
      at: "2026-01-02T00:00:00.000Z",
      data: {
        event_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        id: "33333333-3333-4333-8333-333333333333",
        body: "hello",
      },
    };

    applyRealtimeEvent(queryClient, tenantId, payload, { currentUserId: recipientId });
    applyRealtimeEvent(queryClient, tenantId, payload, { currentUserId: recipientId });

    const rows = queryClient.getQueryData<ListResponse<Conversation[]>>(conversationListKey);
    expect(rows?.data[0]?.unread_count).toBe(1);
  });

  it("appends message.created and dedupes optimistic client_message_id", () => {
    const queryClient = new QueryClient();
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const conversationId = "22222222-2222-4222-8222-222222222222";
    const listKey = messageListQueryKey(conversationId, tenantId);

    seedMessages(queryClient, listKey, [
      {
        id: "optimistic",
        conversation_id: conversationId,
        seq: 1,
        sender_id: null,
        kind: "TEXT",
        body: "hello",
        reply_to_message_id: null,
        client_message_id: "client-1",
        edited_at: null,
        deleted_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ]);

    applyRealtimeEvent(queryClient, tenantId, {
      v: 1,
      type: "message.created",
      conversation_id: conversationId,
      seq: 1,
      data: {
        id: "33333333-3333-4333-8333-333333333333",
        body: "hello",
        client_message_id: "client-1",
      },
    });

    const data = queryClient.getQueryData<InfiniteData<MessageListPage>>(listKey);
    const rows = data?.pages.flatMap((page) => page.items) ?? [];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("33333333-3333-4333-8333-333333333333");
  });

  it("increments unread for the recipient but not the sender", () => {
    const queryClient = new QueryClient();
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const conversationId = "22222222-2222-4222-8222-222222222222";
    const senderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const recipientId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const conversationListKey = conversationListQueryKey(tenantId);
    const conversation: Conversation = {
      id: conversationId,
      kind: "DIRECT",
      name: null,
      description: null,
      channel_name: "conv",
      message_seq: 1,
      last_message_at: null,
      only_admins_can_post: false,
      is_locked: false,
      unread_count: 0,
      participants: [],
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    queryClient.setQueryData<ListResponse<Conversation[]>>(conversationListKey, {
      data: [conversation],
      meta,
    });

    applyRealtimeEvent(
      queryClient,
      tenantId,
      {
        v: 1,
        type: "message.created",
        conversation_id: conversationId,
        actor_id: senderId,
        seq: 2,
        at: "2026-01-02T00:00:00.000Z",
        data: { id: "33333333-3333-4333-8333-333333333333", body: "hello" },
      },
      { currentUserId: recipientId },
    );

    let rows = queryClient.getQueryData<ListResponse<Conversation[]>>(conversationListKey);
    expect(rows?.data[0]?.unread_count).toBe(1);

    queryClient.setQueryData<ListResponse<Conversation[]>>(conversationListKey, {
      data: [{ ...conversation, unread_count: 0 }],
      meta,
    });

    applyRealtimeEvent(
      queryClient,
      tenantId,
      {
        v: 1,
        type: "message.created",
        conversation_id: conversationId,
        actor_id: senderId,
        seq: 3,
        at: "2026-01-03T00:00:00.000Z",
        data: { id: "44444444-4444-4444-8444-444444444444", body: "again" },
      },
      { currentUserId: senderId },
    );

    rows = queryClient.getQueryData<ListResponse<Conversation[]>>(conversationListKey);
    expect(rows?.data[0]?.unread_count).toBe(0);
  });

  it("appends message.created when the message cache is still empty", () => {
    const queryClient = new QueryClient();
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const conversationId = "22222222-2222-4222-8222-222222222222";
    const listKey = messageListQueryKey(conversationId, tenantId);

    applyRealtimeEvent(queryClient, tenantId, {
      v: 1,
      type: "message.created",
      conversation_id: conversationId,
      seq: 42,
      at: "2026-01-02T00:00:00.000Z",
      data: { id: "33333333-3333-4333-8333-333333333333", body: "live message" },
    });

    const data = queryClient.getQueryData<InfiniteData<MessageListPage>>(listKey);
    const rows = data?.pages.flatMap((page) => page.items) ?? [];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.seq).toBe(42);
    expect(rows[0]?.body).toBe("live message");
  });

  it("appends message.created to the newest page when older history is loaded", () => {
    const queryClient = new QueryClient();
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const conversationId = "22222222-2222-4222-8222-222222222222";
    const listKey = messageListQueryKey(conversationId, tenantId);
    const baseMessage = {
      conversation_id: conversationId,
      sender_id: null,
      kind: "TEXT" as const,
      reply_to_message_id: null,
      client_message_id: null,
      edited_at: null,
      deleted_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
    };

    queryClient.setQueryData<InfiniteData<MessageListPage>>(listKey, {
      pages: [
        {
          items: [
            { ...baseMessage, id: "msg-100", seq: 100, body: "latest" },
          ],
          has_more: true,
        },
        {
          items: [
            { ...baseMessage, id: "msg-1", seq: 1, body: "oldest" },
          ],
          has_more: false,
        },
      ],
      pageParams: [undefined, 1],
    });

    applyRealtimeEvent(queryClient, tenantId, {
      v: 1,
      type: "message.created",
      conversation_id: conversationId,
      seq: 101,
      at: "2026-01-02T00:00:00.000Z",
      data: { id: "msg-101", body: "incoming" },
    });

    const data = queryClient.getQueryData<InfiniteData<MessageListPage>>(listKey);
    expect(data?.pages[0]?.items.map((row) => row.seq)).toEqual([100, 101]);
    expect(data?.pages[1]?.items.map((row) => row.seq)).toEqual([1]);
  });

  it("invalidates presence queries on presence.changed without touching conversations", () => {
    const queryClient = new QueryClient();
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    applyRealtimeEvent(queryClient, tenantId, {
      v: 1,
      type: "presence.changed",
      data: { user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", status: "ONLINE" },
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    const predicate = invalidateSpy.mock.calls[0]?.[0]?.predicate;
    expect(predicate?.({ queryKey: ["communication", "presence", "users", tenantId] })).toBe(true);
    expect(predicate?.({ queryKey: ["communication", "conversations", "list", tenantId] })).toBe(
      false,
    );
  });

  it("invalidates conversations on participant events", () => {
    const queryClient = new QueryClient();
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    applyRealtimeEvent(queryClient, tenantId, {
      v: 1,
      type: "participant.added",
      conversation_id: "22222222-2222-4222-8222-222222222222",
      data: {},
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });
});
