import { z } from "zod";

import {
  ConversationSchema,
  ParticipantRoleSchema,
  ParticipantSchema,
} from "@/modules/communication/conversations/schemas";

export const GroupCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  member_user_ids: z.array(z.string().uuid()).default([]),
  max_members: z.number().int().min(2).nullable().optional(),
});
export type GroupCreateRequest = z.infer<typeof GroupCreateRequestSchema>;

export const GroupUpdateRequestSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  description: z.string().nullable().optional(),
  image_attachment_id: z.string().uuid().nullable().optional(),
});
export type GroupUpdateRequest = z.infer<typeof GroupUpdateRequestSchema>;

export const GroupMembersAddRequestSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1),
});
export type GroupMembersAddRequest = z.infer<typeof GroupMembersAddRequestSchema>;

export const GroupSchema = ConversationSchema.extend({
  max_members: z.number(),
  only_admins_can_edit_info: z.boolean(),
  image_attachment_id: z.string().uuid().nullable().optional(),
  context_entity_type: z.string().nullable().optional(),
  context_entity_id: z.string().uuid().nullable().optional(),
});
export type Group = z.infer<typeof GroupSchema>;

export const GroupMemberSchema = ParticipantSchema;
export type GroupMember = z.infer<typeof GroupMemberSchema>;

export { ParticipantRoleSchema };
