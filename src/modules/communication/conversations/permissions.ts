import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const conversationPermissions = {
  read: "communication.conversation.read",
  create: "communication.conversation.create",
  update: "communication.conversation.update",
  delete: "communication.conversation.delete",
} as const satisfies Record<string, CatalogPermission>;
