import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const documentSequencePermissions = {
  read: "masters.document_sequence.read",
  create: "masters.document_sequence.create",
  update: "masters.document_sequence.update",
  delete: "masters.document_sequence.delete",
} as const satisfies Record<string, CatalogPermission>;
