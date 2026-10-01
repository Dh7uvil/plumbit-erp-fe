import type { Conversation } from "@/modules/communication/conversations/schemas";

export function conversationLabel(
  conversation: Conversation,
  currentUserId: string,
  userNames: Map<string, string>,
): string {
  if (conversation.kind === "GROUP") {
    return conversation.name?.trim() || "Group chat";
  }
  const other = conversation.participants.find((p) => p.user_id !== currentUserId);
  if (!other) {
    return "Direct message";
  }
  return userNames.get(other.user_id) ?? "Direct message";
}

export function conversationInitials(label: string): string {
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
