import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const callPermissions = {
  read: "communication.call.read",
  create: "communication.call.create",
  join: "communication.call.join",
  end: "communication.call.end",
} as const satisfies Record<string, CatalogPermission>;
