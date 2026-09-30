import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const taskPermissions = {
  read: "tasks.task.read",
  create: "tasks.task.create",
  update: "tasks.task.update",
  delete: "tasks.task.delete",
  assign: "tasks.task.assign",
  move: "tasks.task.move",
  checklistRead: "tasks.checklist.read",
  checklistCreate: "tasks.checklist.create",
  checklistUpdate: "tasks.checklist.update",
  checklistDelete: "tasks.checklist.delete",
  commentRead: "tasks.comment.read",
  commentCreate: "tasks.comment.create",
  commentUpdate: "tasks.comment.update",
  commentDelete: "tasks.comment.delete",
} as const satisfies Record<string, CatalogPermission>;
