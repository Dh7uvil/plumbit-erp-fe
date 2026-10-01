import type { InfiniteData } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
  OPTIMISTIC_SEQ_BASE,
  appendMessageToInfiniteData,
  flattenMessagePages,
  getHighestLoadedSeq,
  mergePendingIntoInfiniteData,
  upsertMessageInInfiniteData,
} from "@/modules/communication/messages/message-list-utils";
import type { Message, MessageListPage } from "@/modules/communication/messages/schemas";

const conversationId = "22222222-2222-4222-8222-222222222222";

function message(seq: number, id = `msg-${seq}`): Message {
  return {
    id,
    conversation_id: conversationId,
    seq,
    sender_id: null,
    kind: "TEXT",
    body: `message ${seq}`,
    reply_to_message_id: null,
    client_message_id: null,
    edited_at: null,
    deleted_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("message-list-utils", () => {
  it("getHighestLoadedSeq returns the max seq across all pages", () => {
    const data: InfiniteData<MessageListPage> = {
      pages: [
        { items: [message(100)], has_more: true },
        { items: [message(1)], has_more: false },
      ],
      pageParams: [undefined, 1],
    };

    expect(getHighestLoadedSeq(data)).toBe(100);
    expect(getHighestLoadedSeq(undefined)).toBe(0);
  });

  it("appendMessageToInfiniteData appends to the newest page", () => {
    const data: InfiniteData<MessageListPage> = {
      pages: [
        { items: [message(100)], has_more: true },
        { items: [message(1)], has_more: false },
      ],
      pageParams: [undefined, 1],
    };

    const next = appendMessageToInfiniteData(data, message(101, "msg-101"));

    expect(next.pages[0]?.items.map((row) => row.seq)).toEqual([100, 101]);
    expect(next.pages[1]?.items.map((row) => row.seq)).toEqual([1]);
  });

  it("upsertMessageInInfiniteData appends sequential live messages", () => {
    const data: InfiniteData<MessageListPage> = {
      pages: [{ items: [message(10)], has_more: false }],
      pageParams: [undefined],
    };

    const next = upsertMessageInInfiniteData(data, message(11, "msg-11"));

    expect(next.pages[0]?.items.map((row) => row.seq)).toEqual([10, 11]);
  });

  it("upsertMessageInInfiniteData updates the same message id without touching other seq collisions", () => {
    const data: InfiniteData<MessageListPage> = {
      pages: [{ items: [message(10, "msg-10")], has_more: false }],
      pageParams: [undefined],
    };
    const updated = { ...message(10, "msg-10"), body: "I am good", sender_id: "user-a" };
    const next = upsertMessageInInfiniteData(data, updated);

    expect(next.pages[0]?.items[0]?.body).toBe("I am good");
    expect(next.pages[0]?.items[0]?.sender_id).toBe("user-a");
  });

  it("mergePendingIntoInfiniteData preserves all missing rows when previous cache is ahead", () => {
    const previous: InfiniteData<MessageListPage> = {
      pages: [
        {
          items: [message(7, "msg-7"), message(8, "msg-8"), message(9, "msg-9")],
          has_more: false,
        },
      ],
      pageParams: [undefined],
    };
    const incoming: InfiniteData<MessageListPage> = {
      pages: [{ items: [message(7, "msg-7")], has_more: false }],
      pageParams: [undefined],
    };
    const merged = mergePendingIntoInfiniteData(previous, incoming);
    expect(merged.pages[0]?.items.map((row) => row.seq)).toEqual([7, 8, 9]);
  });

  it("mergePendingIntoInfiniteData preserves confirmed RTM rows ahead of a stale refetch", () => {
    const previous: InfiniteData<MessageListPage> = {
      pages: [{ items: [message(7, "msg-7"), message(8, "msg-8")], has_more: false }],
      pageParams: [undefined],
    };
    const incoming: InfiniteData<MessageListPage> = {
      pages: [{ items: [message(7, "msg-7")], has_more: false }],
      pageParams: [undefined],
    };
    const merged = mergePendingIntoInfiniteData(previous, incoming);
    expect(merged.pages[0]?.items.map((row) => row.seq)).toEqual([7, 8]);
    expect(merged.pages[0]?.items.find((row) => row.id === "msg-8")?.body).toBe("message 8");
  });

  it("mergePendingIntoInfiniteData preserves optimistic rows after refetch", () => {
    const pending = {
      ...message(10, "optimistic-a"),
      seq: OPTIMISTIC_SEQ_BASE + 1,
      body: "pending",
      client_message_id: "client-a",
    };
    const previous: InfiniteData<MessageListPage> = {
      pages: [{ items: [pending], has_more: false }],
      pageParams: [undefined],
    };
    const incoming: InfiniteData<MessageListPage> = {
      pages: [{ items: [message(10)], has_more: false }],
      pageParams: [undefined],
    };
    const merged = mergePendingIntoInfiniteData(previous, incoming);
    expect(merged.pages[0]?.items.some((row) => row.client_message_id === "client-a")).toBe(
      true,
    );
  });

  it("upsertMessageInInfiniteData keeps both messages when seq collides but ids differ", () => {
    const optimistic = {
      ...message(10, "optimistic-a"),
      seq: OPTIMISTIC_SEQ_BASE + 1,
      body: "awesome",
      sender_id: "user-a",
      client_message_id: "client-a",
    };
    const data: InfiniteData<MessageListPage> = {
      pages: [{ items: [optimistic], has_more: false }],
      pageParams: [undefined],
    };
    const peer = {
      ...message(10, "msg-b"),
      body: "okay",
      sender_id: "user-b",
    };
    const next = upsertMessageInInfiniteData(data, peer);

    expect(next.pages[0]?.items).toHaveLength(2);
    expect(next.pages[0]?.items.map((row) => row.body).sort()).toEqual(["awesome", "okay"]);
  });

  it("flattenMessagePages sorts globally across pages and dedupes by id", () => {
    const data: InfiniteData<MessageListPage> = {
      pages: [
        { items: [message(7, "msg-7"), message(6, "msg-6")], has_more: true },
        { items: [message(5, "msg-5"), message(4, "msg-4"), message(7, "msg-7")], has_more: false },
      ],
      pageParams: [undefined, 7],
    };

    expect(flattenMessagePages(data).map((row) => row.seq)).toEqual([4, 5, 6, 7]);
  });

  it("upsertMessageInInfiniteData appends out-of-order live messages in seq order", () => {
    const data: InfiniteData<MessageListPage> = {
      pages: [{ items: [message(10)], has_more: false }],
      pageParams: [undefined],
    };

    const withGap = upsertMessageInInfiniteData(data, message(12, "msg-12"));
    const filled = upsertMessageInInfiniteData(withGap, message(11, "msg-11"));

    expect(filled.pages[0]?.items.map((row) => row.seq)).toEqual([10, 11, 12]);
  });
});
