import type { RealtimeEvent } from "@/modules/communication/realtime/event-schemas";

const MAX_KEYS = 500;
const seenKeys: string[] = [];
const seenUnreadMessageKeys: string[] = [];

export function realtimeEventKey(event: RealtimeEvent): string {
  const eventId =
    typeof event.data.event_id === "string"
      ? event.data.event_id
      : typeof (event as { event_id?: string }).event_id === "string"
        ? (event as { event_id?: string }).event_id
        : null;
  if (eventId) {
    return `${event.type}:${eventId}`;
  }
  const messageId =
    typeof event.data.id === "string"
      ? event.data.id
      : typeof event.data.message_id === "string"
        ? event.data.message_id
        : null;
  if (messageId) {
    return `${event.type}:${messageId}:${event.seq ?? ""}`;
  }
  return `${event.type}:${event.conversation_id ?? ""}:${event.seq ?? ""}:${event.at ?? ""}`;
}

function rememberKey(keys: string[], key: string): void {
  keys.push(key);
  if (keys.length > MAX_KEYS) {
    keys.splice(0, keys.length - MAX_KEYS);
  }
}

export function isDuplicateRealtimeEvent(event: RealtimeEvent): boolean {
  const key = realtimeEventKey(event);
  if (seenKeys.includes(key)) {
    return true;
  }
  rememberKey(seenKeys, key);
  return false;
}

/** Prevent double unread when the same message is fanned out on multiple channels. */
export function isDuplicateUnreadMessageEvent(event: RealtimeEvent): boolean {
  if (event.type !== "message.created" || typeof event.data.id !== "string") {
    return false;
  }
  const key = `message.created:unread:${event.data.id}`;
  if (seenUnreadMessageKeys.includes(key)) {
    return true;
  }
  rememberKey(seenUnreadMessageKeys, key);
  return false;
}

export function resetRealtimeEventDedupeForTests(): void {
  seenKeys.length = 0;
  seenUnreadMessageKeys.length = 0;
}
