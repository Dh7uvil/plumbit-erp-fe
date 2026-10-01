"use client";

import { useSyncExternalStore } from "react";

const TYPING_TTL_MS = 5_000;

type TypingEntry = {
  userId: string;
  expiresAt: number;
};

const typingByConversation = new Map<string, Map<string, TypingEntry>>();
const listeners = new Set<() => void>();
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

function notifySubscribers(): void {
  for (const listener of listeners) {
    listener();
  }
}

function pruneExpired(now = Date.now()): void {
  let changed = false;
  for (const [conversationId, users] of typingByConversation) {
    for (const [userId, entry] of users) {
      if (entry.expiresAt <= now) {
        users.delete(userId);
        changed = true;
      }
    }
    if (users.size === 0) {
      typingByConversation.delete(conversationId);
    }
  }
  if (changed) {
    notifySubscribers();
  }
}

function scheduleExpirySweep(): void {
  if (expiryTimer) {
    return;
  }
  expiryTimer = setTimeout(() => {
    expiryTimer = null;
    pruneExpired();
    if (typingByConversation.size > 0) {
      scheduleExpirySweep();
    }
  }, TYPING_TTL_MS);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY_TYPING_USERS: readonly string[] = [];

const typingSnapshotCache = new Map<
  string,
  { signature: string; snapshot: readonly string[] }
>();

function readTypingUsers(conversationId: string): readonly string[] {
  const users = typingByConversation.get(conversationId);
  if (!users || users.size === 0) {
    return EMPTY_TYPING_USERS;
  }
  const now = Date.now();
  const userIds = [...users.values()]
    .filter((entry) => entry.expiresAt > now)
    .sort((left, right) => left.expiresAt - right.expiresAt)
    .map((entry) => entry.userId);
  if (userIds.length === 0) {
    return EMPTY_TYPING_USERS;
  }
  const signature = userIds.join("\0");
  const cached = typingSnapshotCache.get(conversationId);
  if (cached && cached.signature === signature) {
    return cached.snapshot;
  }
  const snapshot = userIds as readonly string[];
  typingSnapshotCache.set(conversationId, { signature, snapshot });
  return snapshot;
}

export function setConversationTyping(
  conversationId: string,
  userId: string,
  isTyping: boolean,
): void {
  if (!conversationId || !userId) {
    return;
  }
  const users = typingByConversation.get(conversationId) ?? new Map<string, TypingEntry>();
  if (isTyping) {
    users.set(userId, { userId, expiresAt: Date.now() + TYPING_TTL_MS });
    typingByConversation.set(conversationId, users);
    scheduleExpirySweep();
  } else if (users.has(userId)) {
    users.delete(userId);
    if (users.size === 0) {
      typingByConversation.delete(conversationId);
    } else {
      typingByConversation.set(conversationId, users);
    }
  } else {
    return;
  }
  notifySubscribers();
}

export function applyTypingRealtimeEvent(
  conversationId: string | null | undefined,
  actorId: string | null | undefined,
  eventType: string,
): void {
  if (!conversationId || !actorId) {
    return;
  }
  if (eventType === "typing.started") {
    setConversationTyping(conversationId, actorId, true);
    return;
  }
  if (eventType === "typing.stopped") {
    setConversationTyping(conversationId, actorId, false);
  }
}

export function useTypingIndicator(conversationId: string): string[] {
  return useSyncExternalStore(
    subscribe,
    () => readTypingUsers(conversationId) as string[],
    () => EMPTY_TYPING_USERS as string[],
  );
}
