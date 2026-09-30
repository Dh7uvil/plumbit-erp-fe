import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const aiAssistantPermissions = {
  use: "ai.assistant.use",
} as const satisfies Record<string, CatalogPermission>;
