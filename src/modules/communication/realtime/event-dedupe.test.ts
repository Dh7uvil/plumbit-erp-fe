import { describe, expect, it, beforeEach } from "vitest";

import {
  isDuplicateRealtimeEvent,
  isDuplicateUnreadMessageEvent,
  realtimeEventKey,
  resetRealtimeEventDedupeForTests,
} from "@/modules/communication/realtime/event-dedupe";

describe("event-dedupe", () => {
  beforeEach(() => {
    resetRealtimeEventDedupeForTests();
  });

  it("uses event_id when present", () => {
    const event = {
      v: 1 as const,
      type: "message.created",
      conversation_id: "22222222-2222-4222-8222-222222222222",
      seq: 1,
      data: { event_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", id: "msg-1" },
    };
    expect(realtimeEventKey(event)).toBe(
      "message.created:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  });

  it("treats the same event as duplicate", () => {
    const event = {
      v: 1 as const,
      type: "message.created",
      conversation_id: "22222222-2222-4222-8222-222222222222",
      seq: 2,
      data: {
        event_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        id: "33333333-3333-4333-8333-333333333333",
      },
    };
    expect(isDuplicateRealtimeEvent(event)).toBe(false);
    expect(isDuplicateRealtimeEvent(event)).toBe(true);
  });

  it("processes both channel fanout deliveries but dedupes unread once", () => {
    const base = {
      v: 1 as const,
      type: "message.created" as const,
      conversation_id: "22222222-2222-4222-8222-222222222222",
      seq: 5,
      data: {
        id: "33333333-3333-4333-8333-333333333333",
        body: "hellop",
      },
    };
    const conversationChannel = {
      ...base,
      data: { ...base.data, event_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    };
    const inboxChannel = {
      ...base,
      data: {
        ...base.data,
        event_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        target_user_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      },
    };

    expect(isDuplicateRealtimeEvent(conversationChannel)).toBe(false);
    expect(isDuplicateRealtimeEvent(inboxChannel)).toBe(false);
    expect(isDuplicateUnreadMessageEvent(conversationChannel)).toBe(false);
    expect(isDuplicateUnreadMessageEvent(inboxChannel)).toBe(true);
  });
});
