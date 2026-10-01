import type { InfiniteData } from "@tanstack/react-query";

import type { Message, MessageListPage } from "@/modules/communication/messages/schemas";

/** Optimistic rows use seq >= this base so they never collide with server seqs. */
export const OPTIMISTIC_SEQ_BASE = 2_000_000_000;

export function isOptimisticSeq(seq: number): boolean {
  return seq >= OPTIMISTIC_SEQ_BASE;
}

/** Highest confirmed (server) seq across all loaded pages. */
export function getHighestConfirmedSeq(
  data: InfiniteData<MessageListPage> | undefined,
): number {
  if (!data?.pages.length) {
    return 0;
  }
  let highest = 0;
  for (const page of data.pages) {
    for (const item of page.items) {
      if (!isOptimisticSeq(item.seq) && item.seq > highest) {
        highest = item.seq;
      }
    }
  }
  return highest;
}

/** Highest seq across all loaded pages (newest messages live on pages[0]). */
export function getHighestLoadedSeq(
  data: InfiniteData<MessageListPage> | undefined,
): number {
  if (!data?.pages.length) {
    return 0;
  }
  let highest = 0;
  for (const page of data.pages) {
    for (const item of page.items) {
      if (item.seq > highest) {
        highest = item.seq;
      }
    }
  }
  return highest;
}

export function nextOptimisticSeq(data: InfiniteData<MessageListPage> | undefined): number {
  const confirmed = getHighestConfirmedSeq(data);
  let pendingOffset = 0;
  if (data?.pages.length) {
    for (const page of data.pages) {
      for (const item of page.items) {
        if (isOptimisticSeq(item.seq)) {
          pendingOffset += 1;
        }
      }
    }
  }
  return OPTIMISTIC_SEQ_BASE + confirmed + pendingOffset + 1;
}

function compareMessages(a: Message, b: Message): number {
  if (a.seq !== b.seq) {
    return a.seq - b.seq;
  }
  const aTime = Date.parse(a.created_at);
  const bTime = Date.parse(b.created_at);
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
    return aTime - bTime;
  }
  return a.id.localeCompare(b.id);
}

function sortPageItems(items: Message[]): Message[] {
  const confirmed = items.filter((row) => !isOptimisticSeq(row.seq));
  const pending = items.filter((row) => isOptimisticSeq(row.seq));
  confirmed.sort(compareMessages);
  pending.sort(compareMessages);
  return [...confirmed, ...pending];
}

/** Sort and dedupe all loaded messages by server seq (handles cross-page WS merge drift). */
export function sortMessagesBySeq(messages: Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const message of messages) {
    byId.set(message.id, message);
  }
  return sortPageItems(Array.from(byId.values()));
}

export function flattenMessagePages(
  data: InfiniteData<MessageListPage> | undefined,
): Message[] {
  if (!data?.pages.length) {
    return [];
  }
  const combined = data.pages.flatMap((page) => page.items);
  return sortMessagesBySeq(combined);
}

export function extractOptimisticMessages(
  data: InfiniteData<MessageListPage> | undefined,
): Message[] {
  if (!data?.pages.length) {
    return [];
  }
  return data.pages.flatMap((page) =>
    page.items.filter((row) => isOptimisticSeq(row.seq)),
  );
}

export function mergePendingIntoInfiniteData(
  previous: InfiniteData<MessageListPage> | undefined,
  incoming: InfiniteData<MessageListPage>,
): InfiniteData<MessageListPage> {
  let merged = incoming;

  if (previous?.pages.length) {
    const incomingIds = new Set(
      incoming.pages.flatMap((page) => page.items.map((row) => row.id)),
    );
    for (const page of previous.pages) {
      for (const item of page.items) {
        if (isOptimisticSeq(item.seq)) {
          continue;
        }
        if (!incomingIds.has(item.id)) {
          merged = upsertMessageInInfiniteData(merged, item);
        }
      }
    }
  }

  const pending = extractOptimisticMessages(previous);
  for (const message of pending) {
    merged = upsertMessageInInfiniteData(
      merged,
      message,
      message.client_message_id,
    );
  }
  return merged;
}

function insertMessageSorted(items: Message[], message: Message): Message[] {
  const existingIndex = items.findIndex(
    (row) =>
      row.id === message.id ||
      (message.client_message_id != null &&
        row.client_message_id === message.client_message_id),
  );
  if (existingIndex >= 0) {
    return items.map((row, index) => (index === existingIndex ? message : row));
  }
  const sorted = sortPageItems([...items, message]);
  return sorted;
}

export function appendMessageToInfiniteData(
  current: InfiniteData<MessageListPage> | undefined,
  message: Message,
): InfiniteData<MessageListPage> {
  if (!current?.pages.length) {
    return {
      pages: [{ items: [message], has_more: false }],
      pageParams: [undefined],
    };
  }
  const pages = [...current.pages];
  const newestPageIndex = 0;
  const newestPage = pages[newestPageIndex]!;
  pages[newestPageIndex] = {
    ...newestPage,
    items: insertMessageSorted(newestPage.items, message),
  };
  return { ...current, pages };
}

export function replaceMessageInInfiniteData(
  current: InfiniteData<MessageListPage> | undefined,
  predicate: (message: Message) => boolean,
  replacement: Message,
): InfiniteData<MessageListPage> | undefined {
  if (!current) {
    return current;
  }
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: sortPageItems(
        page.items.map((message) => (predicate(message) ? replacement : message)),
      ),
    })),
  };
}

export function upsertMessageInInfiniteData(
  current: InfiniteData<MessageListPage> | undefined,
  message: Message,
  clientMessageId?: string | null,
): InfiniteData<MessageListPage> {
  if (!current?.pages.length) {
    return appendMessageToInfiniteData(undefined, message);
  }

  if (clientMessageId) {
    const hasClientMatch = current.pages.some((page) =>
      page.items.some((row) => row.client_message_id === clientMessageId),
    );
    if (hasClientMatch) {
      return replaceMessageInInfiniteData(
        current,
        (row) => row.client_message_id === clientMessageId,
        message,
      )!;
    }
  }

  const hasIdMatch = current.pages.some((page) =>
    page.items.some((row) => row.id === message.id),
  );
  if (hasIdMatch) {
    const existing = current.pages
      .flatMap((page) => page.items)
      .find((row) => row.id === message.id);
    if (
      existing &&
      existing.body === message.body &&
      existing.sender_id === message.sender_id &&
      existing.seq === message.seq
    ) {
      return current;
    }
    return replaceMessageInInfiniteData(current, (row) => row.id === message.id, message)!;
  }

  return appendMessageToInfiniteData(current, message);
}
