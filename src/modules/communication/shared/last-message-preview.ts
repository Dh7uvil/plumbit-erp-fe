import type { LastMessagePreview } from "@/modules/communication/conversations/schemas";
import type { Message } from "@/modules/communication/messages/schemas";

export function toLastMessagePreview(message: Pick<
  Message,
  "id" | "sender_id" | "body" | "kind" | "created_at"
>): LastMessagePreview {
  return {
    id: message.id,
    sender_id: message.sender_id,
    body: message.body,
    kind: message.kind,
    created_at: message.created_at,
  };
}

export function lastMessageFromEventData(
  data: Partial<Message>,
  fallbackAt?: string | null,
): LastMessagePreview | null {
  if (typeof data.id !== "string") {
    return null;
  }
  return {
    id: data.id,
    sender_id: (data.sender_id as string | null | undefined) ?? null,
    body: (data.body as string | null | undefined) ?? null,
    kind: (data.kind as string | undefined) ?? "TEXT",
    created_at: fallbackAt ?? new Date().toISOString(),
  };
}
