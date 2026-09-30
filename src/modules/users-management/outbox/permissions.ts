import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const outboxPermissions = {
  read: "identity.outbox_event.read",
  retry: "identity.outbox_event.retry",
} as const satisfies Record<string, CatalogPermission>;
