import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const presencePermissions = {
  read: "communication.presence.read",
} as const satisfies Record<string, CatalogPermission>;
